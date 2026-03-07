export type MenuId = "file" | "edit" | "view";

export interface MenuState {
  activeMenu: MenuId | null;
  setActiveMenu: (menuId: MenuId | null) => void;
}
