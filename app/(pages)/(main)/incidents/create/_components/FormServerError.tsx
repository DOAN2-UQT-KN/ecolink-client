import { useFormState } from 'react-hook-form';
import { IncidentFormValues } from '../_services/incident.service';

/** Server error code in small print, for users to quote to support (specs/007 FR-015). */
export function ErrorCode({ code }: { code?: string }) {
  if (!code || !/^[A-Z][A-Z0-9_]+$/.test(code)) return null;
  return <span className="block text-xs text-foreground-tertiary">{code}</span>;
}

/** Form-level server error (rate limit, validation errors without a field), above the submit button. */
export default function FormServerError() {
  const { errors } = useFormState<IncidentFormValues>();
  const error = errors.root?.server;
  if (!error?.message) return null;

  return (
    <div role="alert" className="flex flex-col gap-1">
      <span className="text-red-500 text-sm">{error.message}</span>
      <ErrorCode code={typeof error.type === 'string' ? error.type : undefined} />
    </div>
  );
}
