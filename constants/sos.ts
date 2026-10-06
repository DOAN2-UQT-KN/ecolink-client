import type { IconType } from 'react-icons';
import { TbBiohazard, TbFirstAidKit, TbUsersPlus } from 'react-icons/tb';

import type { PillTone } from '@/components/ui/Pill';
import type {
  SosConsciousness,
  SosHazardKind,
  SosIneligibleReason,
  SosResolutionCode,
  SosRole,
  SosState,
  SosTool,
  SosType,
} from '@/apis/sos/models/sos';

/** Labels are untranslated English (i18n keys); call `t()` at the call site. */
export const SOS_TYPE_META: Record<
  SosType,
  {
    label: string;
    hint: string;
    icon: IconType;
    /** CSS colour token (app/globals.css), also used by the map SVG. */
    color: string;
    tone: PillTone;
    /** Tailwind classes built on the token. */
    textClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  manpower: {
    label: 'Manpower / Tools',
    hint: 'The site needs more people or equipment (truck, bags, shovels…)',
    icon: TbUsersPlus,
    color: 'var(--sos-manpower)',
    tone: 'orange',
    textClass: 'text-sos-manpower',
    bgClass: 'bg-sos-manpower/10',
    borderClass: 'border-sos-manpower/40',
  },
  hazard: {
    label: 'Safety / Hazardous waste',
    hint: 'Needles, chemicals, medical waste or bulky debris volunteers must not handle',
    icon: TbBiohazard,
    color: 'var(--sos-hazard)',
    tone: 'amber',
    textClass: 'text-sos-hazard',
    bgClass: 'bg-sos-hazard/10',
    borderClass: 'border-sos-hazard/40',
  },
  medical: {
    label: 'Medical / Accident',
    hint: 'Someone is injured, has heatstroke or needs urgent medical help',
    icon: TbFirstAidKit,
    color: 'var(--sos-medical)',
    tone: 'red',
    textClass: 'text-sos-medical',
    bgClass: 'bg-sos-medical/10',
    borderClass: 'border-sos-medical/40',
  },
};

/** Medical first, as on the map and in lists. */
export const SOS_TYPES: SosType[] = ['medical', 'hazard', 'manpower'];

export const SOS_STATE_META: Record<SosState, { label: string; tone: PillTone }> = {
  open: { label: 'Open', tone: 'orange' },
  helping: { label: 'Help on the way', tone: 'blue' },
  resolved: { label: 'Resolved', tone: 'green' },
  expired: { label: 'Expired', tone: 'neutral' },
  escalated: { label: 'Sent to admin', tone: 'red' },
};

export const SOS_OPEN_STATES: SosState[] = ['open', 'helping', 'escalated'];
export const SOS_OPEN_STATES_PARAM = SOS_OPEN_STATES.join(',');
export const isSosOpen = (state: SosState) => SOS_OPEN_STATES.includes(state);

export const SOS_TOOLS: { value: SosTool; label: string }[] = [
  { value: 'truck', label: 'Garbage truck' },
  { value: 'bags', label: 'Trash bags' },
  { value: 'shovel', label: 'Shovels' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'rake', label: 'Rakes' },
  { value: 'other', label: 'Other tools' },
];

export const SOS_HAZARD_KINDS: { value: SosHazardKind; label: string }[] = [
  { value: 'needles', label: 'Needles / syringes' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'medical_waste', label: 'Medical waste' },
  { value: 'construction_debris', label: 'Bulky construction debris' },
  { value: 'other', label: 'Other hazardous waste' },
];

export const SOS_CONSCIOUSNESS: { value: SosConsciousness; label: string }[] = [
  { value: 'conscious', label: 'Conscious' },
  { value: 'unconscious', label: 'Unconscious' },
];

export const SOS_RESOLUTION_CODES: { value: SosResolutionCode; label: string }[] = [
  { value: 'handled', label: 'Handled' },
  { value: 'false_alarm', label: 'False alarm' },
  { value: 'not_real', label: 'Not real' },
];

export const SOS_ROLE_LABEL: Record<SosRole, string> = {
  volunteer: 'Field volunteer',
  leader: 'Shift leader',
  manager: 'Campaign manager',
  resident: 'Resident',
};

export const SOS_INELIGIBLE_REASON: Record<SosIneligibleReason, string> = {
  not_logged: 'Sign in to send an SOS',
  no_running_shift: 'SOS can only be sent while a shift of this campaign is running',
  not_checked_in: 'Check in to a running shift of this campaign to send an SOS',
  email_unverified: 'Verify your email to send an SOS',
  phone_missing: 'Add a phone number to your profile to send an SOS',
  too_far: 'You must be within 500 m of a meeting point with a running shift',
  location_required: 'Allow location access so we can check you are near the campaign',
  shift_not_allowed: 'You cannot send an SOS for this shift',
};

export const SOS_MAX_PHOTOS = 5;
export const SOS_MAX_PEOPLE = 20;
/** Shown on the medical SOS and in the help invite (spec "An toàn"). */
export const SOS_EMERGENCY_NUMBER = '115';
