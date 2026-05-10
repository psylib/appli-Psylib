-- Migrate rows using deprecated ExpenseCategory values to current values
UPDATE "expenses" SET category = 'transport' WHERE category = 'travel';
UPDATE "expenses" SET category = 'professional_fees' WHERE category = 'professional_dues';
UPDATE "expenses" SET category = 'other' WHERE category IN ('vehicle', 'advertising', 'maintenance');
UPDATE "recurring_expenses" SET category = 'transport' WHERE category = 'travel';
UPDATE "recurring_expenses" SET category = 'professional_fees' WHERE category = 'professional_dues';
UPDATE "recurring_expenses" SET category = 'other' WHERE category IN ('vehicle', 'advertising', 'maintenance');
