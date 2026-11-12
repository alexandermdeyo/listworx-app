-- ROLLBACK for 20261112000200_document_review_guard.sql.
-- Removes the guard; documents and their statuses are kept as they are.
-- NOTE: the larger document-compliance proposal (20261111000100) replaces this
-- same trigger function when it is applied later; roll that back first if both exist.
begin;
drop trigger if exists guard_contractor_document on public.contractor_documents;
drop function if exists public.guard_contractor_document();
commit;
