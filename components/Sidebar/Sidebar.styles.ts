import styled from "styled-components";

type SidebarContainerProps = {
  isOpened: boolean;
};
export const SidebarContainer = styled.aside<SidebarContainerProps>`
  background: ${(props) => props.theme.colors.greyBg};
  width: ${(props) => (props.isOpened ? "100vw" : "0vw")};
  transition: width 0.5s;
  overflow: hidden;
  display: flex;
  z-index:100;
  position:absolute;
  height:100%;
  flex-direction: column;
`;
