import { apiRequest } from '@/lib/api/client';
import { buildQueryString } from '@/lib/api/query-string';
import { getAccessToken } from '@/lib/supabase/server';
import type {
  CreateExpenseRequest,
  CreateIncomeRequest,
  CreateLoanRepaymentRequest,
  CreateLoanRequest,
  CreateLoanWriteOffRequest,
  CreateOpeningBalancesRequest,
  CreateTransferRequest,
  CursorPage,
  ReversalRequest,
  Transaction,
  TransactionMutationResult,
} from '@/types/api';

// API-CONTRACT.md §11. Las siete intenciones + reversa + lectura. Todas las creaciones
// exigen Idempotency-Key (§5) — lo trae quien llama, normalmente el borrador (U12).

export async function createExpense(
  body: CreateExpenseRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/expenses',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createIncome(
  body: CreateIncomeRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/incomes',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createTransfer(
  body: CreateTransferRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/transfers',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createLoan(
  body: CreateLoanRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/loans',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createLoanRepayment(
  body: CreateLoanRepaymentRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/loan-repayments',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createLoanWriteOff(
  body: CreateLoanWriteOffRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/loan-write-offs',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function createOpeningBalances(
  body: CreateOpeningBalancesRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: '/transactions/opening-balances',
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function reverseTransaction(
  id: string,
  body: ReversalRequest,
  idempotencyKey: string,
): Promise<TransactionMutationResult> {
  const accessToken = await getAccessToken();
  return apiRequest<TransactionMutationResult>({
    method: 'POST',
    path: `/transactions/${id}/reversal`,
    body,
    accessToken,
    idempotencyKey,
  });
}

export async function listTransactions(
  params: {
    from?: string;
    to?: string;
    accountId?: string;
    categoryId?: string;
    limit?: number;
    cursor?: string;
  } = {},
): Promise<CursorPage<Transaction>> {
  const accessToken = await getAccessToken();
  return apiRequest<CursorPage<Transaction>>({
    method: 'GET',
    path: `/transactions${buildQueryString(params)}`,
    accessToken,
  });
}

export async function getTransaction(id: string): Promise<Transaction> {
  const accessToken = await getAccessToken();
  return apiRequest<Transaction>({ method: 'GET', path: `/transactions/${id}`, accessToken });
}

export async function updateTransactionDescription(id: string, description: string): Promise<Transaction> {
  const accessToken = await getAccessToken();
  return apiRequest<Transaction>({
    method: 'PATCH',
    path: `/transactions/${id}`,
    body: { description },
    accessToken,
  });
}
