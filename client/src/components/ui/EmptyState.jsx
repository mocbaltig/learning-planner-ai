export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className='bg-[#0f172a] border border-dashed border-white/10 rounded-2xl p-8 text-center'>
      {Icon && <Icon className='text-slate-500 mx-auto mb-3' size={32} />}
      <p className='text-slate-300 font-medium'>{title}</p>
      {description && <p className='text-slate-500 text-sm mt-1'>{description}</p>}
    </div>
  );
}
