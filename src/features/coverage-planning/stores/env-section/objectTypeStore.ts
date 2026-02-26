import { create } from "zustand";
import { type ObjectType, OBJECT_TYPE, OBJECT_TYPE_OPTIONS } from "@/config/enums";

interface ObjectTypeState {
    selectedObjectType: ObjectType;
    setSelectedObjectType: (type: ObjectType) => void;
    objectTypes: typeof OBJECT_TYPE_OPTIONS;
}

export const useObjectTypeStore = create<ObjectTypeState>((set) => ({
    selectedObjectType: OBJECT_TYPE.OFFLINE,
    objectTypes: OBJECT_TYPE_OPTIONS,
    setSelectedObjectType: (type: ObjectType) => set({ selectedObjectType: type }),
}));
