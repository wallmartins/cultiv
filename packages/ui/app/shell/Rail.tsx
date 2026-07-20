import { NewGenerationButton } from "./NewGenerationButton.js";
import { RailBrand } from "./RailBrand.js";
import { RailFilterChips } from "./RailFilterChips.js";
import { RailFooter } from "./RailFooter.js";
import { RailHistoryList } from "./RailHistoryList.js";
import { RailSearch } from "./RailSearch.js";
import type {
  HistoryGroupData,
  HistoryPeriodFilterUI,
  HistoryStatusFilterUI,
  RailEmptyReason
} from "./types.js";

export interface RailProps {
  readonly open: boolean;
  readonly locked: boolean;
  readonly onNewGeneration: () => void;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly activeFilter: HistoryStatusFilterUI;
  readonly onFilterChange: (filter: HistoryStatusFilterUI) => void;
  readonly activePeriod: HistoryPeriodFilterUI;
  readonly onPeriodChange: (period: HistoryPeriodFilterUI) => void;
  readonly groups: readonly HistoryGroupData[];
  readonly emptyReason?: RailEmptyReason;
  readonly onOpenItem: (id: string) => void;
  readonly olderCount?: number;
  readonly onShowOlder?: () => void;
  readonly otherStatusMatches?: number;
  readonly onClearFilter?: () => void;
  readonly voiceConfidenceValue?: number;
  readonly onToggleCompanion: () => void;
  readonly avatarInitials: string;
  readonly onOpenVoiceProfile: () => void;
  readonly onOpenBilling: () => void;
  readonly onOpenSettings: () => void;
  readonly onLogout: () => void;
}

export function Rail({
  open,
  locked,
  onNewGeneration,
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activePeriod,
  onPeriodChange,
  groups,
  emptyReason,
  onOpenItem,
  olderCount,
  onShowOlder,
  otherStatusMatches,
  onClearFilter,
  voiceConfidenceValue,
  onToggleCompanion,
  avatarInitials,
  onOpenVoiceProfile,
  onOpenBilling,
  onOpenSettings,
  onLogout
}: RailProps) {
  const railClass = ["workspace-rail", open && "is-open"].filter(Boolean).join(" ");
  const inertClass = ["rail-inert-region", locked && "is-locked"].filter(Boolean).join(" ");

  return (
    <div className={railClass}>
      <RailBrand />
      <div className={inertClass}>
        <NewGenerationButton onClick={onNewGeneration} disabled={locked} />
        <RailSearch value={search} onChange={onSearchChange} />
        <RailFilterChips
          active={activeFilter}
          onChange={onFilterChange}
          activePeriod={activePeriod}
          onPeriodChange={onPeriodChange}
        />
        <RailHistoryList
          groups={groups}
          emptyReason={emptyReason}
          onOpenItem={onOpenItem}
          olderCount={olderCount}
          onShowOlder={onShowOlder}
          otherStatusMatches={otherStatusMatches}
          onClearFilter={onClearFilter}
        />
      </div>
      <RailFooter
        voiceConfidenceValue={voiceConfidenceValue}
        onToggleCompanion={onToggleCompanion}
        avatarInitials={avatarInitials}
        onOpenVoiceProfile={onOpenVoiceProfile}
        onOpenBilling={onOpenBilling}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
    </div>
  );
}
