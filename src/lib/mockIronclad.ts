export type IroncladRecord = {
  id: string;
  ironcladId?: string;
  name?: string;
  attributes?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  clauses?: Record<string, unknown> | Array<Record<string, unknown>>;
  status?: string;
  type?: string;
  updatedAt?: string;
  url?: string;
};

export const mockRecords: IroncladRecord[] = [
  {
    id: "workflow_silvaris_renewal_2026",
    ironcladId: "IC-MOCK-1",
    name: "Silvaris MSA Renewal",
    status: "completed",
    type: "Customer Contract",
    updatedAt: "2026-06-18T16:22:00.000Z",
    attributes: {
      "Activehosted ID": "silvaris94143.activehosted.com",
      "Counterparty Name": "Silvaris",
      "Record type": "Customer Contract",
      "New Subscription Plan Start Date": "2025-08-01",
      "Next Recurring Payment": "2026-08-01",
      "New Subscription Plan End Date": "2026-08-01",
      "Notice Period Days": 60,
      "Contract Term Length": "12 months",
      "Workflow Owner": "CSM Team",
    },
    clauses: { Renewals: "The subscription will automatically renew for additional periods of the same duration." },
  },
  {
    id: "workflow_silvaris_old_2024",
    name: "Silvaris Prior Order Form",
    status: "completed",
    type: "Customer Contract",
    updatedAt: "2024-08-01T09:15:00.000Z",
    attributes: {
      "Activehosted ID": "silvaris94143.activehosted.com",
      "Counterparty Name": "Silvaris",
      "Record type": "Customer Contract",
      "New Subscription Plan Start Date": "2024-08-01",
      "New Subscription Plan End Date": "2025-08-01",
      "Auto Renew": false,
    },
  },
];

export function mockListWorkflows(query: string): IroncladRecord[] {
  const q = query.toLowerCase();
  return mockRecords.filter((record) => JSON.stringify(record).toLowerCase().includes(q));
}

export function mockGetWorkflow(id: string): IroncladRecord | undefined {
  return mockRecords.find((record) => record.id === id);
}
