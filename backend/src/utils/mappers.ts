export function mapRow(row: Record<string, any>, mappings: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [dbField, apiField] of Object.entries(mappings)) {
    const value = row[dbField];
    result[apiField] = (dbField.endsWith('_id') || dbField === 'id') ? value : 
                       (dbField.startsWith('is_') || dbField === 'paid') ? value === 1 :
                       value;
  }
  return result;
}