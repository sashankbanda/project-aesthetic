"use client";
import { usePathname, useRouter } from "next/navigation";
import { Segmented } from "./ui";

/** Segmented switcher across the Progress hub: Body · Photos · Analytics. */
export default function ProgressNav() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="mb-5">
      <Segmented
        options={[
          { value: "/body", label: "Body" },
          { value: "/photos", label: "Photos" },
          { value: "/analytics", label: "Analytics" },
        ]}
        value={pathname as "/body" | "/photos" | "/analytics"}
        onChange={(v) => router.push(v)}
      />
    </div>
  );
}
