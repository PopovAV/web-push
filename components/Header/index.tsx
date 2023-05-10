import { Menu, ChevronLeft } from "@styled-icons/material";

import {
  HeaderContainer,
  IconContainer,
  TitleContainer,
} from "./Header.styles";
import LoginBtn from "../LoginBtn";

type HeaderProps = {
  isOpened: boolean;
  toggleDrawer: () => void;
};

export default function Header({ isOpened, toggleDrawer }: HeaderProps) {
  return (
    <HeaderContainer>
      <IconContainer onClick={toggleDrawer}>
        {isOpened ? <ChevronLeft /> : <Menu />}
      </IconContainer>
      <TitleContainer><LoginBtn/></TitleContainer>
    </HeaderContainer>
  );
}
