import type { WorkspaceTemplateDefinition, WorkspaceTemplateKey } from "@/lib/demo/types";

export const WORKSPACE_BINDING_ACCOUNT_PLACEHOLDER = "__WORKSPACE_OWNER_ACCOUNT_ID__";

function buildTemplateBootstrapDocument(params: {
  name: string;
  templateKey: WorkspaceTemplateKey;
  anchors: string[];
}): Record<string, unknown> {
  return {
    name: `${params.name} Core`,
    workspaceName: params.name,
    workspaceTemplate: params.templateKey,
    status: "active",
    setupStep: "ready",
    anchors: params.anchors,
    contracts: {
      ownerChannel: {
        type: "MyOS/MyOS Timeline Channel",
      },
      increment: {
        description: "Increment setup counter",
        type: "Conversation/Operation",
        channel: "ownerChannel",
        request: {
          type: "Integer",
        },
      },
      incrementImpl: {
        type: "Conversation/Sequential Workflow Operation",
        operation: "increment",
        steps: [
          {
            name: "IncrementSetupCounter",
            type: "Conversation/Update Document",
            changeset: [
              {
                op: "replace",
                path: "/setupStepCounter",
                val: "${document('/setupStepCounter') + event.message.request}",
              },
            ],
          },
        ],
      },
      reset: {
        description: "Reset setup counter",
        type: "Conversation/Operation",
        channel: "ownerChannel",
      },
      resetImpl: {
        type: "Conversation/Sequential Workflow Operation",
        operation: "reset",
        steps: [
          {
            name: "ResetSetupCounter",
            type: "Conversation/Update Document",
            changeset: [
              {
                op: "replace",
                path: "/setupStepCounter",
                val: 0,
              },
            ],
          },
        ],
      },
    },
    setupStepCounter: 1,
  };
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplateDefinition[] = [
  {
    key: "shop",
    name: "Shop",
    description: "Manage orders, products, and partnerships for a store.",
    icon: "🛍️",
    defaultAssistantName: "Shop Assistant",
    defaultTone: "Practical, proactive, and metrics-focused.",
    anchors: ["#orders", "#products", "#partnerships", "#threads"],
    bootstrap: {
      documentJson: buildTemplateBootstrapDocument({
        name: "Shop Workspace",
        templateKey: "shop",
        anchors: ["#orders", "#products", "#partnerships", "#threads"],
      }),
      bindings: [
        {
          channelName: "ownerChannel",
          mode: "accountId",
          value: WORKSPACE_BINDING_ACCOUNT_PLACEHOLDER,
        },
      ],
    },
  },
  {
    key: "restaurant",
    name: "Restaurant",
    description: "Coordinate reservations, menu, suppliers, and staff.",
    icon: "🍽️",
    defaultAssistantName: "Restaurant Assistant",
    defaultTone: "Hospitality-first, detail-oriented, and action-driven.",
    anchors: ["#reservations", "#menu", "#suppliers", "#staff", "#threads"],
    bootstrap: {
      documentJson: buildTemplateBootstrapDocument({
        name: "Restaurant Workspace",
        templateKey: "restaurant",
        anchors: ["#reservations", "#menu", "#suppliers", "#staff", "#threads"],
      }),
      bindings: [
        {
          channelName: "ownerChannel",
          mode: "accountId",
          value: WORKSPACE_BINDING_ACCOUNT_PLACEHOLDER,
        },
      ],
    },
  },
  {
    key: "generic-business",
    name: "Generic Business",
    description: "A general-purpose operating workspace for business workflows.",
    icon: "🏢",
    defaultAssistantName: "Business Assistant",
    defaultTone: "Clear, strategic, and execution-oriented.",
    anchors: ["#clients", "#contracts", "#operations", "#threads"],
    bootstrap: {
      documentJson: buildTemplateBootstrapDocument({
        name: "Business Workspace",
        templateKey: "generic-business",
        anchors: ["#clients", "#contracts", "#operations", "#threads"],
      }),
      bindings: [
        {
          channelName: "ownerChannel",
          mode: "accountId",
          value: WORKSPACE_BINDING_ACCOUNT_PLACEHOLDER,
        },
      ],
    },
  },
];

export function listWorkspaceTemplates(): WorkspaceTemplateDefinition[] {
  return [...WORKSPACE_TEMPLATES];
}

export function getWorkspaceTemplate(
  templateKey: WorkspaceTemplateKey
): WorkspaceTemplateDefinition | null {
  return WORKSPACE_TEMPLATES.find((template) => template.key === templateKey) ?? null;
}
