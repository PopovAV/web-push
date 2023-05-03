import React from "react";
import {
  AccountBox,
  SendToMobile
} from "@styled-icons/material";


const MENU_OPTIONS: MenuOption[] = [
  {
    name: "ThingerPrint",
    icon: SendToMobile,
    url: "/",
  },
  {
    name: "WebPush",
    icon: SendToMobile,
    url: "/webpush",
  },
  {
    name: "WebAuth",
    icon: AccountBox,
    url: "/webauth",
  },
  {
    name: "WebPin",
    icon: AccountBox,
    url: "/webpin",
  },
];

export type MenuItem = {
  name: string;
  icon: React.ComponentType;
  url: string;
  id: string;
  depth: number;
  subItems?: MenuItem[];
};

type MenuOption = {
  name: string;
  icon: React.ComponentType;
  url: string;
  subItems?: MenuOption[];
};

function makeMenuLevel(options: MenuOption[], depth = 0): MenuItem[] {
  return options.map((option, idx) => ({
    ...option,
    id: depth === 0 ? idx.toString() : `${depth}.${idx}`,
    depth,
    subItems:
      option.subItems && option.subItems.length > 0
        ? makeMenuLevel(option.subItems, depth + 1)
        : undefined,
  }));
}

export const MENU_ITEMS: MenuItem[] = makeMenuLevel(MENU_OPTIONS);
