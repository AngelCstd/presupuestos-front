'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/states/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Money } from '@/components/money/Money';
import { CreatePeriodForm } from '@/features/periods/components/CreatePeriodForm';
import { CoverOverspendSheet } from '@/features/envelopes/components/CoverOverspendSheet';
import { useClosePeriod } from '@/features/periods/hooks/useClosePeriod';
import { useClosePreview } from '@/features/periods/hooks/useClosePreview';
import { usePeriods } from '@/features/periods/hooks/usePeriods';
import { useAllocations } from '@/features/envelopes/hooks/useAllocations';
import { useDeleteAllocation } from '@/features/envelopes/hooks/useDeleteAllocation';
import { useMoveAllocation } from '@/features/envelopes/hooks/useMoveAllocation';
import { showToast } from '@/features/capture/stores/toastStore';
import { formatCalendarDate } from '@/lib/domain/dates';
import { ApiError } from '@/lib/api/errors';
import { extractTransactionIdFromNote, isLateCaptureNote } from '@/lib/domain/late-capture';
import { errorMessageFor } from '@/lib/i18n/errors';
import { es } from '@/lib/i18n/es';
import { qk } from '@/lib/query-keys';
import type { Allocation, Category, ClosePreviewCategory, EnvelopeStatus } from '@/types/api';

export function ClosePeriodView({ periodId }: { periodId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: preview, isLoading: loadingPreview, isFetching, error, refetch } = useClosePreview(periodId);
  const { data: allocations, isLoading: loadingAllocations } = useAllocations(periodId);
  const { data: periodsData, isLoading: loadingPeriods } = usePeriods();

  const closePeriod = useClosePeriod(periodId);
  const deleteAllocation = useDeleteAllocation(periodId);
  const moveAllocation = useMoveAllocation(periodId);

  const [closeError, setCloseError] = useState<string | null>(null);
  const [creatingNext, setCreatingNext] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Allocation | null>(null);
  const [targetCloseCategory, setTargetCloseCategory] = useState<ClosePreviewCategory | null>(null);

  // Check out-of-order close eligibility (§15.2). Must close oldest open timeframe first.
  const openPeriods = useMemo(
    () =>
      (periodsData?.data ?? [])
        .filter((p) => p.status === 'open')
        .sort((a, b) => a.startsOn.localeCompare(b.startsOn)),
    [periodsData?.data],
  );
  const oldestOpenPeriod = openPeriods[0];
  const isOutOfOrder = oldestOpenPeriod !== undefined && oldestOpenPeriod.id !== periodId;

  // Global impact calculations:
  // 1. Net sum of assignedCents across all categories in the close preview.
  //    Includes any negative assigned adjustments from late captures so that
  //    the net total reflects the exact historic funds locked in this timeframe.
  const totalAssignedCents = useMemo(
    () => preview?.categories.reduce((acc, cat) => acc + BigInt(cat.assignedCents), 0n) ?? 0n,
    [preview?.categories],
  );

  // 2. Sum of carryCents where action === 'carry_forward' (accumulate rollover envelopes).
  const totalCarryForwardCents = useMemo(
    () =>
      preview?.categories
        .filter((cat) => cat.action === 'carry_forward')
        .reduce((acc, cat) => acc + BigInt(cat.carryCents), 0n) ?? 0n,
    [preview?.categories],
  );

  // 3. Sum of availableCents where action === 'release' (reset rollover envelopes returning funds).
  const totalReleasedCents = useMemo(
    () =>
      preview?.categories
        .filter((cat) => cat.action === 'release')
        .reduce((acc, cat) => acc + BigInt(cat.availableCents), 0n) ?? 0n,
    [preview?.categories],
  );

  // 4. Sum of carryCents where action === 'carry_deficit' (uncovered deficits).
  const totalDeficitCents = useMemo(
    () =>
      preview?.categories
        .filter((cat) => cat.action === 'carry_deficit')
        .reduce((acc, cat) => acc + BigInt(cat.carryCents), 0n) ?? 0n,
    [preview?.categories],
  );

  // Triage separation:
  const deficitCategories = useMemo(
    () =>
      [...(preview?.categories.filter((cat) => cat.action === 'carry_deficit') ?? [])].sort((a, b) => {
        const diff = BigInt(b.carryCents) - BigInt(a.carryCents);
        if (diff < 0n) return -1;
        if (diff > 0n) return 1;
        return a.categoryName.localeCompare(b.categoryName, 'es');
      }),
    [preview?.categories],
  );

  const normalCategories = useMemo(
    () =>
      [...(preview?.categories.filter((cat) => cat.action !== 'carry_deficit') ?? [])].sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName, 'es'),
      ),
    [preview?.categories],
  );

  // Available donors in this timeframe (envelopes with availableCents > 0)
  const hasDonors = useMemo(
    () => (preview?.categories ?? []).some((cat) => BigInt(cat.availableCents) > 0n),
    [preview?.categories],
  );

  // Adapt categories to format expected by CoverOverspendSheet
  const mappedCategories: Category[] = useMemo(
    () =>
      (preview?.categories ?? []).map((cat) => ({
        id: cat.categoryId,
        name: cat.categoryName,
        kind: 'category' as const,
        currency: 'MXN',
        balanceCents: '0',
        rolloverType: cat.rolloverType,
        archivedAt: null,
        createdAt: '',
        updatedAt: '',
        period: {
          periodId,
          assignedCents: cat.assignedCents,
          spentCents: cat.spentCents,
          availableCents: cat.availableCents,
          hasBudget: cat.hasBudget,
          status: (BigInt(cat.availableCents) > 0n ? 'available' : 'overspent') as EnvelopeStatus,
        },
      })),
    [preview?.categories, periodId],
  );

  const targetCategory: Category | null = useMemo(
    () =>
      targetCloseCategory
        ? {
            id: targetCloseCategory.categoryId,
            name: targetCloseCategory.categoryName,
            kind: 'category' as const,
            currency: 'MXN',
            balanceCents: '0',
            rolloverType: targetCloseCategory.rolloverType,
            archivedAt: null,
            createdAt: '',
            updatedAt: '',
            period: {
              periodId,
              assignedCents: targetCloseCategory.assignedCents,
              spentCents: targetCloseCategory.spentCents,
              availableCents: targetCloseCategory.availableCents,
              hasBudget: targetCloseCategory.hasBudget,
              status: 'overspent' as EnvelopeStatus,
            },
          }
        : null,
    [targetCloseCategory, periodId],
  );

  if (loadingPreview || loadingAllocations || loadingPeriods || !preview || !allocations) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 pb-36 min-w-0">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 pb-36 min-w-0">
        <ErrorState code={error instanceof ApiError ? error.code : 'INTERNAL_ERROR'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isOutOfOrder && oldestOpenPeriod) {
    const rangeText = `${formatCalendarDate(oldestOpenPeriod.startsOn)} – ${formatCalendarDate(oldestOpenPeriod.endsOn)}`;
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-4 pb-36 min-w-0">
        <EmptyState
          tone="pendiente"
          title={es.closePeriodView.outOfOrderTitle}
          description={es.closePeriodView.outOfOrderDesc}
          action={
            <Link
              href={`/periodos/${oldestOpenPeriod.id}/cerrar`}
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-opacity bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 text-base"
            >
              {es.closePeriodView.outOfOrderAction(rangeText)}
            </Link>
          }
        />
      </div>
    );
  }

  const needsNextPeriod = preview.blockers.includes('NEXT_PERIOD_REQUIRED');
  const pendingIsLateCapture = pendingDelete !== null && isLateCaptureNote(pendingDelete.note);
  const pendingOriginTransactionId = pendingDelete ? extractTransactionIdFromNote(pendingDelete.note) : null;

  const handleCover = (fromCategoryId: string, amountCents: string) => {
    if (!targetCloseCategory) return;
    moveAllocation.mutate(
      {
        fromCategoryId,
        toCategoryId: targetCloseCategory.categoryId,
        amountCents,
      },
      {
        onSuccess: () => {
          setTargetCloseCategory(null);
          queryClient.invalidateQueries({ queryKey: qk.closePreview(periodId) });
          queryClient.invalidateQueries({ queryKey: qk.allocations(periodId) });
        },
      },
    );
  };

  const handleDeleteAllocation = () => {
    if (!pendingDelete) return;
    deleteAllocation.mutate(pendingDelete.id, {
      onSuccess: () => {
        setPendingDelete(null);
        queryClient.invalidateQueries({ queryKey: qk.closePreview(periodId) });
        queryClient.invalidateQueries({ queryKey: qk.allocations(periodId) });
      },
    });
  };

  const handleClose = () => {
    setCloseError(null);
    closePeriod.mutate(undefined, {
      onSuccess: (result) => {
        const nextPeriodId = result.nextPeriodId ?? preview.nextPeriodId;
        const nextPeriod = periodsData?.data?.find((p) => p.id === nextPeriodId);
        const rangeText = nextPeriod
          ? `${formatCalendarDate(nextPeriod.startsOn)} – ${formatCalendarDate(nextPeriod.endsOn)}`
          : null;
        showToast(
          rangeText
            ? es.closePeriodView.toastSuccessWithRange(rangeText)
            : es.closePeriodView.toastSuccess,
        );
        router.push('/');
      },
      onError: (mutationError) => {
        setCloseError(mutationError instanceof ApiError ? mutationError.code : 'INTERNAL_ERROR');
      },
    });
  };

  const deficitCount = deficitCategories.length;
  const closeButtonLabel =
    deficitCount > 0
      ? es.closePeriodView.closeWithDeficit(deficitCount)
      : es.closePeriodView.closeWithoutDeficit;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-4 pb-36 min-w-0">
      {/* Header & Date Range */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">
          {formatCalendarDate(preview.startsOn)} – {formatCalendarDate(preview.endsOn)}
        </h1>
        {isFetching ? (
          <p className="flex items-center gap-2 text-xs text-muted">
            <Spinner />
            <span>{es.closePeriodView.updatingPreview}</span>
          </p>
        ) : null}
      </div>

      {/* Irreversibility Alert */}
      <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-3.5 text-sm font-medium text-danger">
        {es.closePeriodView.freezeAlert}
      </p>

      {/* Global Impact Card */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted-background p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {es.closePeriodView.impactTitle}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-md border border-border/50 bg-background/60 p-2.5">
            <span className="text-xs text-muted">{es.closePeriodView.impactAssigned}</span>
            <span className="text-sm font-semibold text-foreground">
              <Money cents={totalAssignedCents.toString()} />
            </span>
            <span className="text-2xs text-muted">{es.closePeriodView.impactAssignedDesc}</span>
          </div>

          <div className="flex flex-col gap-0.5 rounded-md border border-border/50 bg-background/60 p-2.5">
            <span className="text-xs text-muted">{es.closePeriodView.impactCarryForward}</span>
            <span className="text-sm font-semibold text-foreground">
              <Money cents={totalCarryForwardCents.toString()} />
            </span>
            <span className="text-2xs text-muted">{es.closePeriodView.impactCarryForwardDesc}</span>
          </div>

          <div className="flex flex-col gap-0.5 rounded-md border border-border/50 bg-background/60 p-2.5">
            <span className="text-xs text-muted">{es.closePeriodView.impactReleased}</span>
            <span className="text-sm font-semibold text-foreground">
              <Money cents={totalReleasedCents.toString()} />
            </span>
            <span className="text-2xs text-muted">{es.closePeriodView.impactReleasedDesc}</span>
          </div>

          <div className="flex flex-col gap-0.5 rounded-md border border-border/50 bg-background/60 p-2.5">
            <span className="text-xs text-muted">{es.closePeriodView.impactDeficit}</span>
            <span className={`text-sm font-semibold ${totalDeficitCents > 0n ? 'text-danger' : 'text-foreground'}`}>
              <Money cents={totalDeficitCents.toString()} />
            </span>
            <span className="text-2xs text-muted">
              {totalDeficitCents > 0n ? es.closePeriodView.impactDeficitDesc : es.closePeriodView.impactNoDeficit}
            </span>
          </div>
        </div>
      </div>

      {/* Triage Section 1: Deficit Categories (Require Action) */}
      {deficitCategories.length > 0 ? (
        <section aria-labelledby="deficits-title" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="deficits-title" className="text-sm font-semibold text-danger">
              {es.closePeriodView.deficitsSectionTitle}
            </h2>
            <p className="text-xs text-muted">{es.closePeriodView.deficitsSectionSubtitle}</p>
          </div>

          <div className={`flex flex-col gap-2.5 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {deficitCategories.map((category) => (
              <div
                key={category.categoryId}
                className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground truncate min-w-0">{category.categoryName}</span>
                  <span className="text-sm font-semibold text-danger whitespace-nowrap">
                    {es.closeAction[category.action].before}
                    <Money cents={category.carryCents} />
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-2xs text-muted flex-wrap">
                  <span>
                    {es.closePeriodView.assignedLabel} <Money cents={category.assignedCents} />
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {es.closePeriodView.spentLabel} <Money cents={category.spentCents} />
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {es.closePeriodView.remnantLabel} <Money cents={category.availableCents} />
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-danger/20">
                  <p className="text-xs text-muted leading-tight min-w-0">
                    {hasDonors
                      ? es.closePeriodView.sourcesAvailableToCover
                      : es.closePeriodView.noSourcesToCover}
                  </p>
                  {hasDonors ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setTargetCloseCategory(category)}
                    >
                      {es.closePeriodView.coverAction}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Triage Section 2: Normal Rollovers & Releases */}
      <section aria-labelledby="normal-title" className="flex flex-col gap-2.5">
        <h2 id="normal-title" className="text-sm font-semibold text-foreground">
          {es.closePeriodView.normalSectionTitle}
        </h2>

        <ul className={`flex flex-col gap-2 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          {normalCategories.map((category) => (
            <li
              key={category.categoryId}
              className="flex flex-col gap-1.5 rounded-md border border-border bg-background p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate min-w-0">{category.categoryName}</span>
                <span className="text-xs text-muted whitespace-nowrap">
                  {es.closeAction[category.action].before}
                  {category.action !== 'none' ? (
                    <Money cents={category.action === 'release' ? category.availableCents : category.carryCents} />
                  ) : null}
                  {es.closeAction[category.action].after}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-muted flex-wrap">
                <span>
                  {es.closePeriodView.assignedLabel} <Money cents={category.assignedCents} />
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {es.closePeriodView.spentLabel} <Money cents={category.spentCents} />
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {es.closePeriodView.remnantLabel} <Money cents={category.availableCents} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Allocations Review (Inline corrective capability) */}
      {allocations.length > 0 ? (
        <section aria-labelledby="allocations-review-title" className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <h2 id="allocations-review-title" className="text-sm font-semibold text-foreground">
              {es.closePeriodView.allocationsTitle}
            </h2>
            <p className="text-xs text-muted">{es.closePeriodView.allocationsSubtitle}</p>
          </div>

          <div className="flex flex-col gap-2">
            {allocations.map((allocation) => (
              <div
                key={allocation.id}
                className="flex items-center justify-between rounded-md border border-border bg-background p-3 gap-2"
              >
                <span className="text-sm text-foreground truncate min-w-0">{allocation.categoryName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-foreground">
                    <Money cents={allocation.amountCents} />
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingDelete(allocation)}
                  >
                    {es.closePeriodView.deleteAction}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Blockers Assistance */}
      {!preview.canClose ? (
        <div className="flex flex-col gap-2 rounded-md border border-state-depleted/40 bg-state-depleted/10 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {es.closePeriodView.blockersTitle}
          </p>
          {preview.blockers.map((code) => (
            <p key={code} className="text-sm text-foreground">
              {errorMessageFor(code)}
            </p>
          ))}
          {needsNextPeriod ? (
            <div className="pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => setCreatingNext(true)}>
                {es.closePeriodView.createNextPeriodAction}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Closing Commitment Button */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="button"
          disabled={!preview.canClose || isFetching}
          loading={closePeriod.isPending}
          className="w-full py-3 text-base font-semibold"
          onClick={handleClose}
        >
          {closeButtonLabel}
        </Button>
        <p className="text-2xs text-muted text-center">
          {es.closePeriodView.irreversibleNotice}
        </p>

        {closeError ? (
          <p role="alert" className="mt-1 text-center text-sm font-medium text-danger">
            {errorMessageFor(closeError)}
          </p>
        ) : null}
      </div>

      {/* Cover Overspend Sheet Modal */}
      <CoverOverspendSheet
        open={targetCloseCategory !== null}
        target={targetCategory}
        categories={mappedCategories}
        moving={moveAllocation.isPending}
        onClose={() => setTargetCloseCategory(null)}
        onCover={handleCover}
      />

      {/* Create Next Period Modal */}
      <CreatePeriodForm
        open={creatingNext}
        onClose={() => setCreatingNext(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: qk.closePreview(periodId) });
          queryClient.invalidateQueries({ queryKey: qk.periods(null) });
        }}
      />

      {/* Delete Allocation Confirmation Dialog */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={es.closePeriodView.confirmDeleteTitle}
        message={
          pendingIsLateCapture ? (
            <span className="flex flex-col gap-2">
              <span>{es.closePeriodView.confirmDeleteLateCapture}</span>
              {pendingOriginTransactionId ? (
                <Link
                  href={`/movimientos/${pendingOriginTransactionId}`}
                  className="text-sm font-medium text-primary underline"
                >
                  {es.closePeriodView.viewOriginMovement}
                </Link>
              ) : null}
            </span>
          ) : (
            es.closePeriodView.confirmDeleteNormal
          )
        }
        confirmLabel={es.closePeriodView.deleteAction}
        danger
        loading={deleteAllocation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteAllocation}
      />
    </div>
  );
}