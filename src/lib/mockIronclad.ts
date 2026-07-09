export type IroncladRecord = {
  id: string;
  name?: string;
  properties?: Record<string, unknown>;
  status?: string;
  type?: string;
  updatedAt?: string;
  url?: string;
};

export const mockRecords: IroncladRecord[] = [
  {
    id: "rec_silvaris_renewal_2026",
    name: "Silvaris MSA Renewal",
    status: "Executed",
    type: "MSA",
    updatedAt: "2026-06-18T16:22:00.000Z",
    url: "https://na1.ironcladapp.com/records/rec_silvaris_renewal_2026",
    properties: {
      "Account Host": "silvaris94143.activehosted.com",
      "Account Slug": "silvaris94143",
      "Counterparty Name": "Silvaris",
      "Agreement Type": "Master Services Agreement",
      "Contract Status": "Executed",
      "Effective Date": "2025-08-01",
      "Renewal Date": "2026-08-01",
      "Expiration Date": "2026-08-01",
      "Auto Renew": true,
      "Notice Period Days": 60,
      "Term": "12 months",
      "Internal Owner": "CSM Team",
    },
  },
  {
    id: "rec_silvaris_old_2024",
    name: "Silvaris Prior Order Form",
    status: "Expired",
    type: "Order Form",
    updatedAt: "2024-08-01T09:15:00.000Z",
    url: "https://na1.ironcladapp.com/records/rec_silvaris_old_2024",
    properties: {
      "Account Host": "silvaris94143.activehosted.com",
      "Counterparty Name": "Silvaris",
      "Agreement Type": "Order Form",
      "Contract Status": "Expired",
      "Effective Date": "2024-08-01",
      "Expiration Date": "2025-08-01",
      "Auto Renew": false,
    },
  },
];

export function mockListRecords(query: string): IroncladRecord[] {
  const q = query.toLowerCase();
  return mockRecords.filter((record) => JSON.stringify(record).toLowerCase().includes(q));
}

export function mockGetRecord(id: string): IroncladRecord | undefined {
  return mockRecords.find((record) => record.id === id);
}
