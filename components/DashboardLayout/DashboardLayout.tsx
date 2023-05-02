import { useEffect, useState } from "react";
import Header from "../Header";
import Sidebar from "../Sidebar";
import { Container, Content, PageContainer } from "./DashboardLayout.styles";
import { useRouter } from "next/router";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isOpened, setOpened] = useState(false);
  const toggleDrawer = () => {
    setOpened((prev) => !prev);
  };

  const router = useRouter();

  useEffect(() => {
    router.events.on('routeChangeComplete', toggleDrawer)
  }, [])

  return (
    <Container>
      <Header isOpened={isOpened} toggleDrawer={toggleDrawer} />
      <Content>
        <Sidebar isOpened={isOpened} />
        <PageContainer>{children}</PageContainer>
      </Content>
    </Container>
  );
}
