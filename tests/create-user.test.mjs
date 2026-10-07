import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the server's actual provisioning logic without a live Auth account.
const source = fs.readFileSync(
  new URL("../src/lib/server/create-user.server.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(
  source.replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, "undefined"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  process: { env: {} },
  require: () => ({
    createClient() {
      throw new Error("Unexpected live client");
    },
  }),
});
const input = {
  accessToken: "test-token",
  name: "New staff",
  email: "staff@example.org",
  role: "מנהל פרויקטים",
  password: "test-only-password",
};

function mock({
  role = "מנהלת העמותה",
  status = "פעיל",
  invalidToken = false,
  duplicate = false,
  insertError = false,
  deleteError = false,
} = {}) {
  const calls = [];
  let queries = 0;
  const admin = {
    auth: {
      getUser: async (token) => {
        calls.push(["verify", token]);
        return {
          data: { user: invalidToken ? null : { id: "caller" } },
          error: invalidToken ? new Error() : null,
        };
      },
      admin: {
        createUser: async (payload) => {
          calls.push(["create", payload]);
          return { data: { user: { id: "new-auth-id" } }, error: null };
        },
        deleteUser: async (id) => {
          calls.push(["delete", id]);
          return { error: deleteError ? new Error() : null };
        },
        updateUserById: async (id, patch) => {
          calls.push(["ban", id, patch]);
          return { error: null };
        },
      },
    },
    from: (table) => {
      assert.equal(table, "users");
      queries++;
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        maybeSingle: async () => ({ data: { role, status }, error: null }),
        limit: async () => ({
          data: duplicate ? [{ id: "existing" }] : [],
          error: null,
        }),
        insert: async (row) => {
          calls.push(["insert", row]);
          return { error: insertError ? new Error() : null };
        },
      };
      return q;
    },
  };
  return { admin, calls, queryCount: () => queries };
}

test("invalid token is rejected before reading or creating users", async () => {
  const m = mock({ invalidToken: true });
  assert.equal((await exports.createStaffAccount(m.admin, input)).ok, false);
  assert.equal(m.queryCount(), 0);
});

for (const options of [
  { role: "מנהל פרויקטים" },
  { role: "מנהל כספים" },
  { status: "מושעה" },
]) {
  test(`unauthorized caller cannot provision: ${JSON.stringify(options)}`, async () => {
    const m = mock(options);
    assert.equal((await exports.createStaffAccount(m.admin, input)).ok, false);
    assert.equal(
      m.calls.some(([name]) => name === "create"),
      false,
    );
  });
}

test("duplicate profile is rejected without creating an auth account", async () => {
  const m = mock({ duplicate: true });
  assert.equal((await exports.createStaffAccount(m.admin, input)).ok, false);
  assert.equal(
    m.calls.some(([name]) => name === "create"),
    false,
  );
});

for (const role of ["מנהלת העמותה", "מנהל מערכת"]) {
  test(`${role} creates matching auth/profile records without storing password`, async () => {
    const m = mock({ role });
    assert.equal((await exports.createStaffAccount(m.admin, input)).ok, true);
    const row = m.calls.find(([name]) => name === "insert")[1];
    assert.equal(row.id, "new-auth-id");
    assert.equal(row.role, input.role);
    assert.equal(row.last_login, null);
    assert.equal("password" in row, false);
    assert.equal(
      m.calls.some(([name]) => name === "delete"),
      false,
    );
  });
}

test("profile failure deletes the new auth account", async () => {
  const m = mock({ insertError: true });
  assert.equal((await exports.createStaffAccount(m.admin, input)).ok, false);
  assert.equal(m.calls.find(([name]) => name === "delete")[1], "new-auth-id");
});

test("failed rollback attempts to ban the incomplete account", async () => {
  const m = mock({ insertError: true, deleteError: true });
  assert.equal((await exports.createStaffAccount(m.admin, input)).ok, false);
  assert.equal(m.calls.find(([name]) => name === "ban")[1], "new-auth-id");
});
