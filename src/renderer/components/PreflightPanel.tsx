import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { PreflightSnapshot, ProductionMode, ProjectRecord } from '../../shared/contracts';

export function PreflightPanel({ project, productionMode }: { project: ProjectRecord; productionMode: ProductionMode }) {
  const [snapshot, setSnapshot] = useState<PreflightSnapshot | null>(null);
  useEffect(() => {
    let active = true;
    void window.noobi.getPreflight(project.id, productionMode).then((result) => { if (active) setSnapshot(result); }).catch(() => undefined);
    return () => { active = false; };
  }, [project.id, productionMode, project.status]);
  if (!snapshot) return <div className="preflight-panel is-loading"><CircleDashed size={13} className="spin" /> 正在检查启动条件…</div>;
  return (
    <section className={`preflight-panel ${snapshot.canStart ? 'is-ready' : 'is-blocked'}`} aria-label="启动前检查">
      <header><div><span>PRE-FLIGHT</span><strong>{snapshot.productionMode === 'prototype' ? '快速原型' : '交付验证'} · 启动检查</strong></div><b>{snapshot.canStart ? 'READY' : 'BLOCKED'}</b></header>
      <p>{snapshot.summary}</p>
      <div className="preflight-checks">
        {snapshot.checks.map((check) => <span key={check.id} className={`is-${check.status}`} title={check.message}>{check.status === 'ready' || check.status === 'not-needed' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}{check.label}</span>)}
      </div>
    </section>
  );
}
