export type ColumnType =
  | 'boolean'
  | 'date'
  | 'duration'
  | 'integer'
  | 'number'
  | 'percentage'
  | 'string';

enum FieldKey {
  ASSIGNEE = 'assignee',
  TITLE = 'title',
  ISSUE = 'issue',
}

export const ISSUE_FIELDS: Readonly<Record<FieldKey, ColumnType>> = {
  [FieldKey.ASSIGNEE]: 'string',
  [FieldKey.TITLE]: 'string',
  [FieldKey.ISSUE]: 'string',
};
