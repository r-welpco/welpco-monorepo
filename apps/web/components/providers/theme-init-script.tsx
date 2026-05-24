/** Runs before React hydrates so the first paint matches stored theme preferences. */
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var r=localStorage.getItem("welpco-personalization");var p=r?JSON.parse(r):{};var m=p.themeMode||"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var el=document.documentElement;el.setAttribute("data-theme",d?"dark":"light");el.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
      }}
    />
  );
}
