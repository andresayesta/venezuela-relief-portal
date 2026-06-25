import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export default async function VerifiedPage() {
  const locale = await getLocale();
  const tr = t(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 leading-relaxed">
      <h1 className="text-2xl font-semibold">{tr.verify.title}</h1>
      <p className="mt-3 text-base text-slate-800">{tr.verify.body}</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{tr.verify.scamTitle}</h2>
        <p className="mt-2 text-sm text-slate-700">{tr.verify.scamIntro}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {tr.verify.scamBullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </section>

      <p className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800">
        {tr.verify.trustClose}
      </p>
    </div>
  );
}
