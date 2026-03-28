import { db } from "./db";
import type { AppEnumValue, AppEnumGroup } from "@/types/serviceTypes";

export async function getEnumGroup(enumGroup: AppEnumGroup): Promise<AppEnumValue[]> {
    return db.table("appEnumSetup").where("enumGroup").equals(enumGroup).toArray();
}

export async function getAllAppEnums(): Promise<AppEnumValue[]> {
    return db.table("appEnumSetup").toArray();
}
