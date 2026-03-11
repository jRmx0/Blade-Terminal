export type MenuId = "file" | "edit" | "view" | "run";

export interface MenuState {
  activeMenu: MenuId | null;
  setActiveMenu: (menuId: MenuId | null) => void;
}
