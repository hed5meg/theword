// Optional anchoring for a curated piece: link it to a passage, an arrangement,
// and/or a principle. Rendered inside the essay/episode compose forms.

export interface AnchorOption {
  id: string;
  label: string;
}

export function AnchorFields({
  passages,
  arrangements,
  tenets,
  values,
}: {
  passages: AnchorOption[];
  arrangements: AnchorOption[];
  tenets: AnchorOption[];
  values?: { passageId?: string; arrangementId?: string; tenetId?: string };
}) {
  const selectClass =
    "mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-ink outline-none focus:border-gold-soft";
  return (
    <fieldset className="rounded-xl border border-line bg-card/40 p-4">
      <legend className="px-1 text-sm text-ink-soft">
        Anchor to scripture <span className="text-ink-faint">(optional)</span>
      </legend>
      <p className="text-xs text-ink-faint">
        Link this piece to a passage, arrangement, or principle and it will also
        appear there.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs text-ink-faint">
          Passage
          <select name="passage_id" defaultValue={values?.passageId ?? ""} className={selectClass}>
            <option value="">— none —</option>
            {passages.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-ink-faint">
          Arrangement
          <select
            name="arrangement_id"
            defaultValue={values?.arrangementId ?? ""}
            className={selectClass}
          >
            <option value="">— none —</option>
            {arrangements.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-ink-faint">
          Principle
          <select name="tenet_id" defaultValue={values?.tenetId ?? ""} className={selectClass}>
            <option value="">— none —</option>
            {tenets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
