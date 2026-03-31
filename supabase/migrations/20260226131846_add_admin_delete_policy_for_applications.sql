/*
  # Add Admin DELETE Policy for Contractor Applications

  1. Changes
    - Add DELETE policy for contractor_applications table
    - Allows admins to delete applications to clean up test data or reject applications permanently

  2. Security
    - Only users with ADMIN role can delete applications
    - Uses auth.uid() to verify user identity
*/

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete applications"
  ON contractor_applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );