const { createRequire } = require('node:module');
const root = '/Users/rabie/Developer/TowerGit/welpco-monorepo';
const req = createRequire(root + '/apps/bff/package.json');
req('ts-node').register({project:root+'/apps/bff/tsconfig.json',transpileOnly:true});
req('reflect-metadata');
const { Logger } = req('@nestjs/common');
Logger.overrideLogger(false);
const src = p => req(root+'/apps/bff/src/'+p);
(async () => {
 const {AuthModule}=src('domains/user-management/auth/auth.module.ts');
 const {DependenciesScanner}=req('@nestjs/core/scanner');
 const dynamic=AuthModule.forRoot({registerController:false});
 const registered=[];
 DependenciesScanner.prototype.reflectControllers.call({
  reflectMetadata:(key,cls)=>Reflect.getMetadata(key,cls)||[],
  container:{getDynamicMetadataByToken:()=>dynamic.controllers||[]},
  insertController:c=>registered.push(c), reflectDynamicMetadata:()=>{}
 },AuthModule,'audit');
 const c=registered[0];
 console.log('disabled_domain_controller_still_registered',registered.map(x=>x.name));
 console.log('legacy_resend_guards',(Reflect.getMetadata('__guards__',c.prototype.resendVerificationEmail)||[]).map(x=>x.name));
 const {MemoryCacheService}=src('domains/user-management/cache/memory-cache.service.ts');
 const a=new MemoryCacheService(), b=new MemoryCacheService();
 await a.set('password-reset:token:audit','user-audit',900);
 console.log('reset_token_on_other_instance',await b.get('password-reset:token:audit'));
 const now=Date.now; await a.set('expired-audit',1,1); Date.now=()=>now()+2000;
 console.log('expired_entry_retained_without_lookup',a.store.has('expired-audit'));Date.now=now;
 const {JwtService}=req('@nestjs/jwt');
 const {AuthService}=src('domains/user-management/auth/auth.service.ts');
 const auth=Object.create(AuthService.prototype);
 const user={id:'audit-user',email:'audit@example.invalid',accountType:'Customer',status:'Active',authVersion:0};
 auth.configService={get:k=>({JWT_SECRET:'audit-access-only',JWT_REFRESH_SECRET:'audit-refresh-only'})[k]};
 auth.jwtService=new JwtService();auth.userRepository={findOne:async()=>user};auth.logger={warn:()=>{},error:()=>{}};
 const old=auth.jwtService.sign({sub:user.id,authVersion:0},{secret:'audit-refresh-only',expiresIn:'1h'});
 const r1=await auth.refreshToken(old),r2=await auth.refreshToken(old);
 console.log('same_refresh_token_accepted_twice',!!r1.accessToken&&!!r2.accessToken);
 const {BackgroundCheckPaymentService}=src('domains/safety-verification/background-check-payment.service.ts');
 const svc=Object.create(BackgroundCheckPaymentService.prototype);
 const order={id:'audit-order',userId:user.id,paymentStatus:'pending'};let invited=0;
 svc.orderRepo={findOne:async()=>order,save:async x=>x};
 svc.backgroundCheckService={onPaymentSucceeded:async()=>{invited++}};svc.logger={warn:()=>{}};
 await svc.handleCheckoutSessionCompleted({id:'cs_audit',payment_status:'unpaid',metadata:{purpose:'background_check',userId:user.id,orderId:order.id}});
 console.log('unpaid_checkout_marked_paid',order.paymentStatus,'background_check_dispatched',invited);
 const path=svc.backgroundCheckStepPath('en');
 const url=new URL('https://audit.example.invalid'+path+'?payment=success&session_id=cs_audit');
 console.log('checkout_return_query',Object.fromEntries(url.searchParams));
 const {CertnWebhookController}=src('domains/safety-verification/certn-webhook.controller.ts');
 const {createHmac}=require('node:crypto');
 const certn=new CertnWebhookController({get:()=> 'audit-certn-only'},{handleCertnWebhook:async()=>{}});
 const raw='{\"report_status\": \"COMPLETE\"}';
 const timestamp=String(Math.floor(Date.now()/1000));
 const v1=createHmac('sha256','audit-certn-only').update(timestamp+'.'+raw).digest('hex');
 try {await certn.handleCertn(JSON.parse(raw),'t='+timestamp+',v1='+v1,undefined);console.log('certn_documented_signature_accepted',true)}
 catch(e){console.log('certn_documented_signature_accepted',false,'status',e.getStatus())}
 const {RateLimiterService}=src('domains/geocode/rate-limiter.service.ts');
 const limiter=new RateLimiterService();limiter.lastRequestTime=Date.now();
 await Promise.all(Array.from({length:20},()=>limiter.waitForSlot()));
 console.log('geocode_concurrent_slots_limit_10_actual',limiter.getStats().activeRequests);
})().catch(e=>{console.error(e.stack);process.exitCode=1});
