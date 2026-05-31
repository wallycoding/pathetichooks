<script setup lang="ts">
type Token =
  | { type: "punct"; value: string }
  | { type: "key"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: string }
  | { type: "boolean"; value: string }
  | { type: "null"; value: string }
  | { type: "ws"; value: string };

const props = defineProps<{ source: string; showLineNumbers?: boolean }>();

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const ch = input[i]!;

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      let j = i;
      while (j < len && /\s/.test(input[j]!)) j++;
      tokens.push({ type: "ws", value: input.slice(i, j) });
      i = j;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (input[j] === "\\" && j + 1 < len) {
          j += 2;
          continue;
        }
        if (input[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      const raw = input.slice(i, j);
      let k = j;
      while (k < len && /\s/.test(input[k]!)) k++;
      if (input[k] === ":") {
        tokens.push({ type: "key", value: raw });
      } else {
        tokens.push({ type: "string", value: raw });
      }
      i = j;
      continue;
    }

    if (/[-0-9]/.test(ch)) {
      const m = input.slice(i).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (m) {
        tokens.push({ type: "number", value: m[0] });
        i += m[0].length;
        continue;
      }
    }

    if (input.startsWith("true", i) || input.startsWith("false", i)) {
      const word = input.startsWith("true", i) ? "true" : "false";
      tokens.push({ type: "boolean", value: word });
      i += word.length;
      continue;
    }

    if (input.startsWith("null", i)) {
      tokens.push({ type: "null", value: "null" });
      i += 4;
      continue;
    }

    tokens.push({ type: "punct", value: ch });
    i++;
  }

  return tokens;
}

const tokens = computed(() => tokenize(props.source));
const lines = computed(() => props.source.split("\n").length);

function classFor(t: Token["type"]): string {
  switch (t) {
    case "key":
      return "text-sky-300";
    case "string":
      return "text-emerald-300";
    case "number":
      return "text-amber-300";
    case "boolean":
      return "text-fuchsia-300";
    case "null":
      return "text-rose-300";
    case "punct":
      return "text-muted-foreground/70";
    default:
      return "";
  }
}
</script>

<template>
  <div class="flex font-mono text-[14px] leading-relaxed">
    <div
      v-if="showLineNumbers"
      class="select-none border-r border-border/40 pr-3 mr-3 text-right text-muted-foreground/50"
      aria-hidden="true"
    >
      <div v-for="n in lines" :key="n">{{ n }}</div>
    </div>
    <pre class="flex-1 whitespace-pre-wrap break-all"><template
        v-for="(t, i) in tokens"
        :key="i"
      ><span v-if="t.type === 'ws'">{{ t.value }}</span><span
          v-else
          :class="classFor(t.type)"
        >{{ t.value }}</span></template></pre>
  </div>
</template>
