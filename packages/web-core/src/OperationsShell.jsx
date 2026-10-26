import { useEffect, useState } from "react";
import {
  House,
  Drop,
  Gauge,
  ChartBar,
  MapTrifold,
  ListChecks,
  Truck,
  WarningCircle,
  SignOut,
  SquaresFour,
} from "@phosphor-icons/react";
import "./operations.css";

const ICONS = {
  overview: House,
  output: Drop,
  readings: Gauge,
  reports: ChartBar,
  diagram: MapTrifold,
  incidents: WarningCircle,
  map: MapTrifold,
  board: ListChecks,
  resources: Truck,
  review: ListChecks,
};
export function OperationsShell({
  title,
  tone = "water",
  navigation,
  active,
  onNavigate,
  systemController,
  children,
}) {
  const [session] = useState(() => systemController.getSession());
  const [preview] = useState(
    () =>
      !session.authenticated &&
      new URLSearchParams(window.location.search).get("preview") === "1",
  );
  useEffect(() => {
    if (!session.authenticated && !preview) systemController.redirectToLogin();
    return systemController.subscribeToExpiration(() =>
      systemController.logout(),
    );
  }, [session.authenticated, preview, systemController]);
  if (!session.authenticated && !preview)
    return <main className="ops-loading">กำลังไปหน้าเข้าสู่ระบบ…</main>;
  return (
    <div className={`ops-app ops-${tone}`}>
      <header className="ops-topbar">
        <a
          className="ops-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onNavigate(navigation[0].id);
          }}
        >
          <span className="ops-brand-mark">ทพ</span>
          <span>
            <strong>Smart Tha Pho</strong>
            <small>เทศบาลเมืองท่าโพธิ์</small>
          </span>
        </a>
        <div className="ops-user">
          <span>
            {preview
              ? "ดูตัวอย่างหน้าจอ"
              : session.user?.name || "เจ้าหน้าที่เทศบาล"}
          </span>
          <button onClick={() => systemController.switchSystem()}>
            <SquaresFour size={19} />
            เปลี่ยนระบบ
          </button>
          {!preview && (
            <button onClick={() => systemController.logout()}>
              <SignOut size={19} />
              ออกจากระบบ
            </button>
          )}
        </div>
      </header>
      <aside className="ops-sidebar">
        <h2>{title}</h2>
        <nav aria-label="เมนูระบบ">
          {navigation.map((item) => {
            const Icon = ICONS[item.id] || ListChecks;
            return (
              <button
                key={item.id}
                className={active === item.id ? "is-active" : ""}
                aria-current={active === item.id ? "page" : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <p>
          รุ่นทดลองสำหรับตรวจรูปแบบงาน
          <br />
          ไม่ใช่ฐานข้อมูลกลาง
        </p>
      </aside>
      <main className="ops-main">
        <div className="ops-prototype">
          <WarningCircle size={20} />
          <span>
            ข้อมูลตัวอย่างและข้อมูลที่กรอกเก็บเฉพาะเบราว์เซอร์นี้
            ไม่ซิงก์ข้ามเครื่อง
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}

export function Message({ error, success }) {
  return error ? (
    <div className="ops-message is-error" role="alert">
      {error}
    </div>
  ) : success ? (
    <div className="ops-message is-success" role="status">
      {success}
    </div>
  ) : null;
}
export function PageHeading({ title, description, children }) {
  return (
    <header className="ops-page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="ops-actions">{children}</div>
    </header>
  );
}
