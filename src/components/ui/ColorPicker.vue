/** * ColorPicker - Google Keep-style color selection */
<script setup lang="ts">
import { computed } from "vue";
import type { NoteColor } from "@/types/note";

const props = defineProps<{
  modelValue?: NoteColor;
  size?: "sm" | "md";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: NoteColor): void;
}>();

const colors: {
  value: NoteColor;
  label: string;
  bg: string;
  border: string;
}[] = [
  {
    value: "default",
    label: "Default",
    bg: "bg-base-white",
    border: "border-gray-300",
  },
  { value: "red", label: "Red", bg: "bg-red-100", border: "border-red-300" },
  {
    value: "orange",
    label: "Orange",
    bg: "bg-orange-100",
    border: "border-orange-300",
  },
  {
    value: "yellow",
    label: "Yellow",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
  },
  {
    value: "green",
    label: "Green",
    bg: "bg-green-100",
    border: "border-green-300",
  },
  {
    value: "blue",
    label: "Blue",
    bg: "bg-blue-100",
    border: "border-blue-300",
  },
  {
    value: "purple",
    label: "Purple",
    bg: "bg-purple-100",
    border: "border-purple-300",
  },
  {
    value: "pink",
    label: "Pink",
    bg: "bg-pink-100",
    border: "border-pink-300",
  },
];

const sizeClasses = computed(() => {
  return props.size === "sm" ? "w-6 h-6" : "w-8 h-8";
});

function selectColor(color: NoteColor) {
  emit("update:modelValue", color);
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <button
      v-for="color in colors"
      :key="color.value"
      type="button"
      :class="[
        sizeClasses,
        color.bg,
        'border-2 rounded-full transition-all cursor-pointer hover:scale-110',
        modelValue === color.value
          ? 'ring-2 ring-base-black ring-offset-2 scale-110'
          : color.border,
      ]"
      :aria-label="`Select ${color.label} color`"
      :title="color.label"
      @click="selectColor(color.value)"
    />
  </div>
</template>
