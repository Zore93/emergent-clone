import React, { useState } from 'react';
import { Gift, Compass, Sparkles, Users, Building2, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { individualPlans, enterprisePlans } from '../mock';
import { Switch } from './ui/switch';

const iconMap = { Gift, Compass, Sparkles, Users, Building2, ShieldCheck };

function PlanCard({ plan, annual }) {
  const Icon = iconMap[plan.icon];
  let priceDisplay;
  let suffix = '/ month';
  let save = null;

  if (typeof plan.price === 'string') {
    priceDisplay = plan.price;
    suffix = '';
  } else if (plan.price === 0) {
    priceDisplay = '$0';
  } else {
    const val = annual ? plan.priceAnnual : plan.priceMonthly;
    priceDisplay = `$${val}`;
    if (annual && plan.saveAnnual) save = `Save $${plan.saveAnnual}`;
  }

  return (
    <div className={`relative rounded-2xl bg-white border ${plan.highlighted ? 'border-neutral-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)]' : 'border-neutral-200'} p-8 flex flex-col`}>
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          Most popular
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[28px] font-semibold text-neutral-900">{plan.name}</span>
          {Icon && <Icon className="w-5 h-5 text-neutral-700" />}
        </div>
        {plan.priceAnnual !== undefined && (
          <div className="flex items-center gap-2 text-[13px] text-blue-600">
            <span>Annual</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-[14px] text-neutral-500">{plan.tag}</p>

      <div className="mt-8 flex items-end gap-2 flex-wrap">
        <span className="text-[40px] font-semibold text-neutral-900 leading-none">{priceDisplay}</span>
        {suffix && <span className="text-[14px] text-neutral-500 mb-1">{suffix}</span>}
        {save && (
          <span className="ml-auto bg-blue-50 text-blue-600 text-[12px] font-medium px-2.5 py-1 rounded-full">
            {save}
          </span>
        )}
      </div>

      <ul className="mt-7 space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[14px] text-neutral-700">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={3} />
            {f}
          </li>
        ))}
      </ul>

      <button className={`mt-8 group inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-medium transition-colors ${plan.highlighted ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'}`}>
        {plan.cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

export default function Pricing() {
  const [mode, setMode] = useState('individual');
  const [annual, setAnnual] = useState(true);
  const plans = mode === 'individual' ? individualPlans : enterprisePlans;

  return (
    <section id="pricing" className="relative py-20 lg:py-28 bg-neutral-50">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-[40px] sm:text-[52px] font-semibold tracking-tight text-neutral-900">
            Transparent pricing for every builder
          </h2>
          <p className="mt-4 text-[16px] text-neutral-500 max-w-2xl mx-auto">
            Choose the plan that fits your building ambitions.
            <br />
            From weekend projects to enterprise applications, we&apos;ve got you covered.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="inline-flex bg-white rounded-full p-1 border border-neutral-200">
              <button onClick={() => setMode('individual')} className={`px-6 py-2 rounded-full text-[14px] font-medium transition-colors ${mode === 'individual' ? 'bg-neutral-900 text-white' : 'text-neutral-700'}`}>Individual</button>
              <button onClick={() => setMode('enterprise')} className={`px-6 py-2 rounded-full text-[14px] font-medium transition-colors ${mode === 'enterprise' ? 'bg-neutral-900 text-white' : 'text-neutral-700'}`}>Enterprise</button>
            </div>

            <div className="flex items-center gap-2 text-[14px] text-neutral-700">
              <span className={annual ? 'text-neutral-400' : ''}>Monthly</span>
              <Switch checked={annual} onCheckedChange={setAnnual} />
              <span className={!annual ? 'text-neutral-400' : ''}>Annual</span>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <PlanCard key={p.name} plan={p} annual={annual} />
          ))}
        </div>
      </div>
    </section>
  );
}
