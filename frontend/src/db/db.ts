/**
 * IndexedDB database setup using Dexie.js.
 *
 * Stores conversations and messages entirely on-device in the browser.
 */

import Dexie, { type EntityTable } from "dexie";
import type { Conversation, StoredMessage } from "../types";

const db = new Dexie("AniAskDB") as Dexie & {
  conversations: EntityTable<Conversation, "id">;
  messages: EntityTable<StoredMessage, "id">;
};

db.version(1).stores({
  conversations: "id, updatedAt",
  messages: "id, conversationId",
});

export { db };
