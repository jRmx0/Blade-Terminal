export type MenuId = "file" | "view";

export interface MenuState {
  activeMenu: MenuId | null;
  setActiveMenu: (menuId: MenuId | null) => void;
}
