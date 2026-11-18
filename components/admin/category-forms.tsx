"use client";

import { useActionState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type AdminFormState,
} from "@/lib/actions/admin";
import { confirm } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

const initialState: AdminFormState = { status: "idle" };

function StatusMessage({ state }: { state: AdminFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "mt-2 rounded-lg px-3 py-2 text-xs",
        state.status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800",
      )}
    >
      {state.message}
    </p>
  );
}

const inputClass =
  "focus-ring w-full rounded-lg border border-stone-200 px-3 py-2 text-sm placeholder:text-stone-400";

export interface CategoryRowData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
  premiumOnly: boolean;
  topicCount: number;
}

export function CategoryFields({
  defaultValues,
}: {
  defaultValues?: CategoryRowData;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-12">
      <input
        name="slug"
        required
        pattern="[a-z0-9-]{2,64}"
        placeholder="slug (a-z, 0-9, -)"
        defaultValue={defaultValues?.slug}
        aria-label="Slug раздела"
        className={cn(inputClass, "sm:col-span-3")}
      />
      <input
        name="name"
        required
        maxLength={80}
        placeholder="Название"
        defaultValue={defaultValues?.name}
        aria-label="Название раздела"
        className={cn(inputClass, "sm:col-span-3")}
      />
      <input
        name="description"
        maxLength={500}
        placeholder="Описание (необязательно)"
        defaultValue={defaultValues?.description ?? ""}
        aria-label="Описание раздела"
        className={cn(inputClass, "sm:col-span-4")}
      />
      <input
        name="position"
        type="number"
        min={0}
        max={10000}
        defaultValue={defaultValues?.position ?? 100}
        aria-label="Порядок отображения"
        className={cn(inputClass, "sm:col-span-1")}
        title="Позиция"
      />
      <div className="flex items-center gap-3 sm:col-span-1">
        <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600" title="Раздел только для премиум">
          <input
            name="premiumOnly"
            type="checkbox"
            defaultChecked={defaultValues?.premiumOnly}
            className="h-4 w-4 accent-amber-500"
          />
          ✦
        </label>
        <input
          name="icon"
          maxLength={48}
          defaultValue={defaultValues?.icon ?? "MessagesSquare"}
          aria-label="Иконка (имя lucide)"
          placeholder="иконка"
          className={cn(inputClass, "hidden w-24 xl:block")}
        />
      </div>
    </div>
  );
}

export function CreateCategoryForm() {
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="rounded-2xl border border-orange-200/70 bg-orange-50/40 p-4">
      <p className="text-sm font-semibold text-stone-800">Новый раздел</p>
      <div className="mt-2">
        <CategoryFields />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <StatusMessage state={state} />
        <button
          type="submit"
          disabled={isPending}
          className="focus-ring ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Создать
        </button>
      </div>
    </form>
  );
}

export function CategoryRow({ category }: { category: CategoryRowData }) {
  const [updateState, updateAction, isUpdating] = useActionState(updateCategoryAction, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCategoryAction, initialState);
  const state = updateState.status !== "idle" ? updateState : deleteState;

  return (
    <li className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <form action={updateAction}>
        <input type="hidden" name="id" value={category.id} />
        <div className="flex items-center justify-between gap-3">
          <CategoryFields defaultValues={category} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-stone-500">
            /forum/{category.slug} · тем: {category.topicCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isUpdating}
              title="Сохранить изменения"
              aria-label="Сохранить раздел"
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-600 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-60"
            >
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Сохранить
            </button>
            <button
              type="button"
              disabled={isDeleting || category.topicCount > 0}
              title={category.topicCount > 0 ? "Нельзя удалить: в разделе есть темы" : "Удалить раздел"}
              aria-label="Удалить раздел"
              onClick={async () => {
                if (await confirm("Удалить раздел?", `«${category.name}» будет удалён безвозвратно.`)) {
                  const fd = new FormData();
                  fd.set("id", category.id);
                  deleteAction(fd);
                }
              }}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Удалить
            </button>
          </div>
        </div>
        <StatusMessage state={state} />
      </form>
    </li>
  );
}
