/**
 * Setup file for Vitest
 * Configures global test environment
 */

import { beforeAll, afterEach, vi } from "vitest";
import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";

// Mock Quasar components globally
config.global.stubs = {
  QBtn: { template: "<button><slot /></button>" },
  QInput: { template: '<input v-bind="$attrs" />' },
  QTextarea: { template: '<textarea v-bind="$attrs" />' },
  QSelect: { template: '<select v-bind="$attrs"><slot /></select>' },
  QCheckbox: { template: '<input type="checkbox" v-bind="$attrs" />' },
  QMenu: { template: "<div><slot /></div>" },
  QList: { template: "<ul><slot /></ul>" },
  QItem: { template: "<li><slot /></li>" },
  QItemSection: { template: "<div><slot /></div>" },
  QIcon: { template: '<i v-bind="$attrs" />' },
  QCard: { template: "<div><slot /></div>" },
  QCardSection: { template: "<div><slot /></div>" },
  QSeparator: { template: "<hr />" },
  QSpace: { template: "<div />" },
  QTooltip: { template: "<div><slot /></div>" },
  QDialog: { template: '<div v-if="$attrs.modelValue"><slot /></div>' },
};

// Mock Vue Router
config.global.mocks = {
  $t: (key: string) => key,
  $i18n: {
    locale: "en",
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: {
    en: {
      archive: "Archive",
      delete: "Delete",
    },
  },
});

config.global.plugins = [...(config.global.plugins ?? []), i18n];

// Setup crypto.randomUUID if not available (for Node.js < 19)
beforeAll(() => {
  if (typeof crypto === "undefined" || !("randomUUID" in crypto)) {
    global.crypto = {
      randomUUID: () => {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      },
    } as any;
  }
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Suppress console errors/warnings during tests (optional)
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
