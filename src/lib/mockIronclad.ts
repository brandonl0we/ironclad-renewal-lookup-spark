export type IroncladRecord = {
  id: string;
  ironcladId?: string;
  title?: string;
  name?: string;
  attributes?: Record<string, unknown>;
  schema?: Record<string, { displayName?: string; type?: string; propertyKey?: string }>;
  properties?: Record<string, unknown>;
  clauses?: Record<string, unknown> | Array<Record<string, unknown>>;
  status?: string;
  type?: string;
  updatedAt?: string;
  created?: string;
  lastUpdated?: string;
  template?: string;
  isCancelled?: boolean;
  isComplete?: boolean;
  recordIds?: string[];
  creator?: Record<string, unknown>;
  approvals?: Record<string, unknown>;
  signatures?: Record<string, unknown>;
  url?: string;
};

export const mockRecords: IroncladRecord[] = [
  {
    id: "6a552ba85e81fa7ca0e57827",
    ironcladId: "IC-15499",
    title: "Customer Contract with Sindibor",
    status: "completed",
    created: "2026-07-13T12:00:00.000Z",
    lastUpdated: "2026-07-16T12:00:00.000Z",
    template: "customer-contract-template",
    isCancelled: false,
    isComplete: true,
    schema: {
      aRR: { displayName: "ARR", type: "monetaryAmount" },
      counterpartyName: { displayName: "Counterparty Name", type: "string" },
      contractStartDate: { displayName: "New Subscription Plan Start Date", type: "date" },
      contractEndDate: { displayName: "New Subscription Plan End Date", type: "date" },
      nextPaymentDate: { displayName: "Next Recurring Payment", type: "date" },
      contractTermLength: { displayName: "Contract Term Length", type: "string" },
      workflowOwnerEmail: { displayName: "Workflow Owner Email", type: "email" },
      activehostedId: { displayName: "Activehosted ID", type: "string" },
    },
    attributes: {
      aRR: { currency: "USD", amount: 1845 },
      activehostedId: "sindibor.activehosted.com",
      counterpartyName: "Sindibor",
      contractStartDate: "2026-07-17T00:00:00-03:00",
      contractEndDate: "2027-07-17T00:00:00-03:00",
      nextPaymentDate: "2027-07-17T00:00:00-03:00",
      contractTermLength: "1 year",
      workflowOwnerEmail: "owner@activecampaign.com",
    },
  },
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

export function mockGetRecord(id: string): IroncladRecord | undefined {
  if (id !== "IC-15499" && id !== "6a552ba85e81fa7ca0e57827") return undefined;
  return {
    id: "record_sindibor",
    ironcladId: "IC-15499",
    properties: {
      recordType: { type: "string", value: "Customer Contract" },
      clause_terms: {
        type: "clause",
        value: {
          source: "ai",
          clauseType: "terms",
          clauseText: "This Order Form expires if it is not fully executed by its stated deadline.",
        },
      },
      clause_renewals: {
        type: "clause",
        value: {
          source: "ai",
          clauseType: "renewals",
          clauseText: "The subscription will automatically renew for additional periods of the same duration.",
        },
      },
    },
  };
}
