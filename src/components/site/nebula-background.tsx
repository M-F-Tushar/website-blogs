export function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div className="nebula-orb nebula-orb-a absolute -left-[10%] -top-[20%] h-[70%] w-[70%] rounded-full bg-sky-600/18 blur-[120px]" />
      <div className="nebula-orb nebula-orb-b absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-blue-700/18 blur-[100px]" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] [mask-image:linear-gradient(180deg,white,transparent)]" />
    </div>
  );
}
