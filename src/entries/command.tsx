import { User } from 'lucide-react';
import { mountCommand } from '@/entries/mount';
import { CommandCenter } from '@/pages/CommandCenter';
import { NoticeToast } from '@/components/NoticeToast';
import { LANDING_URL } from '@/navigation';
import { useIncidents, useResources } from '@/store';

export function CommandScreen() {
  const [resources, resourceActions] = useResources();
  const [incidents, incidentActions] = useIncidents(true);

  return (
    <div className="relative">
      <CommandCenter
        resources={resources}
        incidents={incidents}
        onAdvance={incidentActions.advanceIncident}
        onReport={incidentActions.reportIncident}
        onAddResource={resourceActions.addResource}
        onDuplicateResource={resourceActions.duplicateResource}
        onRemoveResource={resourceActions.removeResource}
        onUpdateResource={resourceActions.updateResource}
      />
      {}
      <a
        href={LANDING_URL}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 border border-cream/30 bg-surface-dark px-4 py-2.5 text-sm font-500 text-cream transition-colors hover:bg-surface-darkSecondary"
        style={{ borderRadius: '2px' }}
      >
        <User size={15} /> Citizen View
      </a>
      <NoticeToast />
    </div>
  );
}

mountCommand(<CommandScreen />);
