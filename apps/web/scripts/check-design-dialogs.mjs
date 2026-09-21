// Isolated application consumers with local hook fixtures; no backend or account mutations.
import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const directory = await mkdtemp(path.join(tmpdir(), 'welpco-dialogs-'));
const mocks = {
  'next/navigation': `const router={push:(p)=>window.__navigation.push(p),replace:(p)=>window.__navigation.push(p)};
    export const redirect=(p)=>window.__navigation.push(p); export const useRouter=()=>router; export const useSearchParams=()=>new URLSearchParams();
    export const usePathname=()=>'/dashboard/marketplace/fixture'; export const useParams=()=>({});`,
  '@/stores/authStore': `export const useAuthStore=()=>({user:{id:'fixture-welper',role:'welper'}});`,
  '@/lib/hooks/use-customer-summary': `export const useCustomerPublicSummary=()=>({isPending:false,isError:false,data:{displayName:'Alex Martin',profileComplete:true,averageRating:4.8,reviewCount:12,completedBookingsCount:8,jobPostingsCount:3,memberSince:'2025-01-01'}});`,
  '@/lib/hooks/use-bookings': `export const useServiceQuestions=()=>({data:[],isLoading:false,isError:false});`,
  '@/lib/hooks/use-job-posting': `import {useState} from 'react';
    export const useJobPosting=()=>({isLoading:false,isError:false,data:{id:'fixture',title:'Local garden help',status:'published',canApply:true,description:'Help with our garden.',scheduledDate:'2026-10-15',scheduledStartTime:'10:00',scheduledEndTime:'12:00',durationMinutes:120,locationCity:'Montreal',locationRegion:'QC',categoryLabel:'Gardening',answers:{},serviceQuestionCategoryId:'fixture',matchingOfferings:[{id:'offering',title:'Garden care',hourlyRate:25}]}});
    export const useJobApplications=()=>({data:[]});
    export function useApplyToJob(){const [isPending,setPending]=useState(false);return {isPending,mutateAsync:async(v)=>{window.__calls.push(v);setPending(true);await new Promise((resolve)=>{window.__finishApply=()=>{setPending(false);resolve();};});}};}
    export const useWithdrawJobApplication=()=>({isPending:false});
    export const useCancelJobPosting=()=>({isPending:false});`,
};
const entry = `import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
  import {Theme} from '@radix-ui/themes'; import {NextIntlClientProvider} from 'next-intl';
  import {Dialog as LocalDialog} from '@/components/ui/dialog'; import {Dialog as SharedDialog} from '@welpco/ui/dialog';
  import {DashboardAppearanceTuner} from '@/components/features/personalization/dashboard-appearance-tuner';
  import {RoleSwitchDialog} from '@/components/features/dashboard/role-switch-dialog';
  import {CustomerPreviewDialog} from '@/components/features/dashboard/customer-preview-dialog';
  import {ApplyBlockedDialog} from '@/components/features/marketplace/apply-blocked-dialog';
  import JobDetailPageClient from '@/app/(dashboard)/dashboard/marketplace/[id]/page-client';
  import en from '@/messages/en.json'; import fr from '@/messages/fr.json';
  window.__calls=[];window.__navigation=[];window.__sameDialog=LocalDialog===SharedDialog;
  const query=new URLSearchParams(location.search);const fixture=query.get('fixture');const locale=query.get('locale')||'en';
  function App(){const [open,setOpen]=useState(false);const [pending,setPending]=useState(false);
    return <NextIntlClientProvider locale={locale} messages={locale==='fr'?fr:en} timeZone="America/Toronto"><Theme accentColor="grass">
      {fixture==='appearance'?<DashboardAppearanceTuner/>:fixture==='marketplace'?<JobDetailPageClient jobId="fixture"/>:<><button onClick={()=>setOpen(true)}>Open fixture</button>
      {fixture==='role'&&<RoleSwitchDialog open={open} onOpenChange={setOpen} targetRole="customer" isSwitching={pending} onConfirm={async()=>{window.__calls.push('switch');setPending(true);window.__finishRole=()=>setPending(false);}}/>}
      {fixture==='customer'&&<CustomerPreviewDialog open={open} onOpenChange={setOpen} customerId="fixture"/>}
      {fixture==='blocked'&&<ApplyBlockedDialog open={open} onOpenChange={setOpen} reason="NO_MATCHING_OFFERING"/>}</>}
    </Theme></NextIntlClientProvider>;
  } createRoot(document.getElementById('root')).render(<App/>);`;
let browser;
let server;
try {
  await build({ stdin: { contents: entry, loader: 'tsx', resolveDir: app }, outfile: path.join(directory, 'fixture.js'), bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', tsconfig: path.join(app, 'tsconfig.json'), define: { 'process.env.NODE_ENV': '"test"', 'process.env': '{}'  }, plugins: [{ name: 'local-hook-fixtures', setup(builder) {
    builder.onResolve({ filter: /.*/ }, (args) => Object.hasOwn(mocks, args.path) ? { path: args.path, namespace: 'fixture' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({ contents: mocks[args.path], loader: 'js', resolveDir: app }));
  } }] });
  const css = await readFile(require.resolve('@radix-ui/themes/styles.css'));
  server = createServer(async (req, res) => {
    if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(await readFile(path.join(directory, 'fixture.js'))); }
    else if (req.url === '/theme.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); }
    else res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/theme.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  page.on('pageerror', (error) => console.error(error));
  await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const messages = { en: JSON.parse(await readFile(path.join(app, 'messages/en.json'))), fr: JSON.parse(await readFile(path.join(app, 'messages/fr.json'))) };
  for (const locale of ['en', 'fr']) {
    const labels = messages[locale].dashboard;
    for (const fixture of ['role', 'customer', 'blocked', 'marketplace', 'appearance']) {
      await page.goto(`http://127.0.0.1:${server.address().port}/?fixture=${fixture}&locale=${locale}`);
      await expect.poll(() => page.evaluate(() => window.__sameDialog)).toBe(true);
      if (fixture !== 'marketplace' && fixture !== 'appearance') await page.getByRole('button', { name: 'Open fixture' }).click();
      if (fixture === 'role') {
        const copy = labels.nav.roleSwitch;
        const dialog = page.getByRole('dialog', { name: copy.confirmToCustomerTitle });
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(copy.confirmToCustomerBody);
        await dialog.getByRole('button', { name: copy.confirm, exact: true }).click();
        await page.keyboard.press('Escape');
        await dialog.getByRole('button', { name: copy.cancel, exact: true }).first().click();
        await expect(dialog).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.__calls.length)).toBe(1);
        await page.evaluate(() => window.__finishRole());
        await expect(dialog.getByRole('button', { name: copy.confirm, exact: true })).toBeEnabled();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
      } else if (fixture === 'customer') {
        const dialog = page.getByRole('dialog', { name: 'Alex Martin' });
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(labels.customerPreview.statsHeading);
        await dialog.getByRole('button', { name: labels.customerPreview.close }).click();
        await expect(dialog).toBeHidden();
      } else if (fixture === 'blocked') {
        const copy = labels.marketplace.applyBlocked;
        const dialog = page.getByRole('dialog', { name: copy.title });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: copy.manageOfferings }).click();
        await expect.poll(() => page.evaluate(() => window.__navigation)).toEqual(['/dashboard/profile?tab=offerings']);
        await expect(dialog).toBeHidden();
      } else if (fixture === 'appearance') {
        await page.getByRole('button', { name: 'Open appearance tuner' }).click();
        const thumb = page.getByRole('slider', { name: 'Backdrop opacity (light)' });
        await expect(thumb).toHaveAttribute('aria-valuenow', '0.5');
        await thumb.focus();
        await page.keyboard.press('ArrowRight');
        await expect(thumb).toHaveAttribute('aria-valuenow', '0.51');
        await expect(page.getByRole('slider', { name: 'Backdrop opacity (dark)' })).toHaveAttribute('aria-valuenow', '0.5');
      } else {
        const copy = labels.marketplace.detail;
        await page.getByRole('button', { name: copy.applyToJob, exact: true }).click();
        const dialog = page.getByRole('dialog', { name: copy.applyDialogTitle });
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText('Local garden help');
        await dialog.getByRole('button', { name: copy.continueToProposal }).click();
        await expect(dialog.locator('#welper-apply-form')).toBeVisible();
        await dialog.getByRole('button', { name: copy.cancel, exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect.poll(() => page.evaluate(() => window.__calls.length)).toBe(0);
      }
      if (fixture !== 'appearance' && fixture !== 'marketplace') await expect(page.getByRole('button', { name: 'Open fixture' })).toBeFocused();
      console.log(`PASS ${fixture} (${locale}): actual consumer, local hooks`);
    }
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
