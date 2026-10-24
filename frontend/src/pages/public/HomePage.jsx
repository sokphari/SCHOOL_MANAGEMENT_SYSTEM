// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { getPublicSettings } from "../../api/publicSettingApi";

// export default function HomePage() {
//   const [settings, setSettings] = useState({
//     school_name: "my schools",
//     school_phone: "",
//     school_email: "",
//     school_address: "",
//     logo_url: "",
//     banner_url: "",
//   });

//   const [loading, setLoading] = useState(true);

//   const fetchSettings = async () => {
//     try {
//       const res = await getPublicSettings();
//       setSettings({
//         school_name: res.data.school_name || "my schools",
//         school_phone: res.data.school_phone || "",
//         school_email: res.data.school_email || "",
//         school_address: res.data.school_address || "",
//         logo_url: res.data.logo_url || "",
//         banner_url: res.data.banner_url || "",
//       });
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSettings();
//   }, []);

//   return (
//     <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
//       <header
//         style={{
//           background: "#ffffff",
//           borderBottom: "1px solid #e5e7eb",
//           padding: "16px 32px",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//           {settings.logo_url ? (
//             <img
//               src={settings.logo_url}
//               alt="School Logo"
//               style={{
//                 width: "48px",
//                 height: "48px",
//                 borderRadius: "50%",
//                 objectFit: "cover",
//                 border: "1px solid #e5e7eb",
//               }}
//             />
//           ) : (
//             <div
//               style={{
//                 width: "48px",
//                 height: "48px",
//                 borderRadius: "50%",
//                 background: "#1d4ed8",
//                 color: "#fff",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontWeight: "bold",
//                 fontSize: "18px",
//               }}
//             >
//               S
//             </div>
//           )}
//           <div>
//             <h2 style={{ margin: 0, fontSize: "20px" }}>
//               {settings.school_name}
//             </h2>
//             <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
//               School Management System
//             </p>
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: "12px" }}>
//           <Link
//             to="/request-scan"
//             style={{
//               textDecoration: "none",
//               padding: "10px 16px",
//               borderRadius: "8px",
//               background: "#2563eb",
//               color: "#fff",
//               fontWeight: "600",
//             }}
//           >
//             Submit Request
//           </Link>

//           <Link
//             to="/admin/login"
//             style={{
//               textDecoration: "none",
//               padding: "10px 16px",
//               borderRadius: "8px",
//               background: "#111827",
//               color: "#fff",
//               fontWeight: "600",
//             }}
//           >
//             Admin Login
//           </Link>
//         </div>
//       </header>

//       <section
//         style={{
//           padding: "64px 32px",
//           maxWidth: "1200px",
//           margin: "0 auto",
//           display: "grid",
//           gridTemplateColumns: "1fr 1fr",
//           gap: "32px",
//           alignItems: "center",
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               fontSize: "48px",
//               marginBottom: "16px",
//               lineHeight: 1.2,
//               color: "#111827",
//             }}
//           >
//             Welcome to {settings.school_name}
//           </h1>

//           <p
//             style={{
//               fontSize: "18px",
//               color: "#4b5563",
//               lineHeight: 1.8,
//               marginBottom: "24px",
//             }}
//           >
//             We are committed to providing quality education, a safe learning
//             environment, and strong values for every student. Our school system
//             supports students, teachers, and administrators with modern digital
//             management tools.
//           </p>

//           <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
//             <Link
//               to="/request-scan"
//               style={{
//                 textDecoration: "none",
//                 padding: "12px 18px",
//                 borderRadius: "8px",
//                 background: "#2563eb",
//                 color: "#fff",
//                 fontWeight: "600",
//               }}
//             >
//               Student Request
//             </Link>

//             <Link
//               to="/admin/login"
//               style={{
//                 textDecoration: "none",
//                 padding: "12px 18px",
//                 borderRadius: "8px",
//                 border: "1px solid #d1d5db",
//                 color: "#111827",
//                 fontWeight: "600",
//                 background: "#fff",
//               }}
//             >
//               Go to Admin
//             </Link>
//           </div>
//         </div>

//         <div>
//           <div
//             style={{
//               height: "350px",
//               borderRadius: "20px",
//               overflow: "hidden",
//               boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
//               background: "#e5e7eb",
//             }}
//           >
//             {settings.banner_url ? (
//               <img
//                 src={settings.banner_url}
//                 alt="School Banner"
//                 style={{
//                   width: "100%",
//                   height: "100%",
//                   objectFit: "cover",
//                 }}
//               />
//             ) : (
//               <div
//                 style={{
//                   height: "100%",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   color: "#1e3a8a",
//                   fontSize: "24px",
//                   fontWeight: "700",
//                   background:
//                     "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)",
//                 }}
//               >
//                 {loading ? "Loading..." : "School Banner / Logo"}
//               </div>
//             )}
//           </div>
//         </div>
//       </section>

//       <section
//         style={{
//           maxWidth: "1200px",
//           margin: "0 auto",
//           padding: "0 32px 48px",
//         }}
//       >
//         <h2
//           style={{ fontSize: "32px", marginBottom: "20px", color: "#111827" }}
//         >
//           About Our School
//         </h2>

//         <div
//           style={{
//             background: "#fff",
//             padding: "24px",
//             borderRadius: "16px",
//             boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
//             color: "#4b5563",
//             lineHeight: 1.8,
//           }}
//         >
//           Our school focuses on academic excellence, student discipline,
//           personal growth, and community values. We believe that every child
//           deserves an inspiring environment to learn, grow, and succeed.
//         </div>
//       </section>

//       <section
//         style={{
//           maxWidth: "1200px",
//           margin: "0 auto",
//           padding: "0 32px 48px",
//         }}
//       >
//         <h2
//           style={{ fontSize: "32px", marginBottom: "20px", color: "#111827" }}
//         >
//           Our Commitment
//         </h2>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
//             gap: "20px",
//           }}
//         >
//           <div
//             style={{
//               background: "#fff",
//               padding: "24px",
//               borderRadius: "16px",
//               boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>Quality Education</h3>
//             <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
//               We provide a strong academic foundation with modern learning
//               methods.
//             </p>
//           </div>

//           <div
//             style={{
//               background: "#fff",
//               padding: "24px",
//               borderRadius: "16px",
//               boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>Safe Environment</h3>
//             <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
//               We create a respectful, secure, and supportive environment for all
//               students.
//             </p>
//           </div>

//           <div
//             style={{
//               background: "#fff",
//               padding: "24px",
//               borderRadius: "16px",
//               boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>Student Development</h3>
//             <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
//               We support students not only in academics but also in character
//               and responsibility.
//             </p>
//           </div>
//         </div>
//       </section>

//       <section
//         style={{
//           maxWidth: "1200px",
//           margin: "0 auto",
//           padding: "0 32px 64px",
//         }}
//       >
//         <h2
//           style={{ fontSize: "32px", marginBottom: "20px", color: "#111827" }}
//         >
//           Contact Us
//         </h2>

//         <div
//           style={{
//             background: "#fff",
//             padding: "24px",
//             borderRadius: "16px",
//             boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
//             lineHeight: 1.8,
//             color: "#4b5563",
//           }}
//         >
//           <p>
//             <strong>School Name:</strong> {settings.school_name}
//           </p>
//           <p>
//             <strong>Phone:</strong> {settings.school_phone || "-"}
//           </p>
//           <p>
//             <strong>Email:</strong> {settings.school_email || "-"}
//           </p>
//           <p>
//             <strong>Address:</strong> {settings.school_address || "-"}
//           </p>
//         </div>
//       </section>

//       <footer
//         style={{
//           background: "#111827",
//           color: "#fff",
//           textAlign: "center",
//           padding: "20px",
//         }}
//       >
//         © 2026 {settings.school_name}. All rights reserved.
//       </footer>
//     </div>
//   );
// }








import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicSettings } from "../../api/publicSettingApi";

export default function HomePage() {
  const [settings, setSettings] = useState({
    school_name: "my schools",
    school_phone: "",
    school_email: "",
    school_address: "",
    logo_url: "",
    banner_url: "",
  });

  const [loading, setLoading] = useState(true);

  // --- Typing animation state ---
  const [displayedName, setDisplayedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);

  const fetchSettings = async () => {
    try {
      const res = await getPublicSettings();
      setSettings({
        school_name: res.data.school_name || "my schools",
        school_phone: res.data.school_phone || "",
        school_email: res.data.school_email || "",
        school_address: res.data.school_address || "",
        logo_url: res.data.logo_url || "",
        banner_url: res.data.banner_url || "",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // --- Typing animation effect ---
  useEffect(() => {
    if (loading) return; // wait until school_name is ready

    const fullText = settings.school_name;
    let timeout;

    if (!isDeleting && displayedName.length < fullText.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayedName(fullText.slice(0, displayedName.length + 1));
      }, 100);
    } else if (!isDeleting && displayedName.length === fullText.length) {
      // Pause at full text before deleting
      timeout = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayedName.length > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setDisplayedName(fullText.slice(0, displayedName.length - 1));
      }, 55);
    } else if (isDeleting && displayedName.length === 0) {
      // Pause at empty before retyping
      setIsDeleting(false);
      setLoopIndex((prev) => prev + 1);
    }

    return () => clearTimeout(timeout);
  }, [displayedName, isDeleting, loading, settings.school_name, loopIndex]);

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="School Logo"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #e5e7eb",
              }}
            />
          ) : (
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#1d4ed8",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              S
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: "20px" }}>
              {settings.school_name}
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              School Management System
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            to="/request-scan"
            style={{
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#fff",
              fontWeight: "600",
            }}
          >
            Submit Request
          </Link>

          {/* <Link
            to="/admin/login"
            style={{
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "#111827",
              color: "#fff",
              fontWeight: "600",
            }}
          >
            Admin Login
          </Link> */}
        </div>
      </header>

      <section
        style={{
          padding: "64px 32px",
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
          alignItems: "center",
        }}
      >
        <div>
          {/* ✅ Typing animation applied ONLY here */}
          <h1
            style={{
              fontSize: "48px",
              marginBottom: "16px",
              lineHeight: 1.2,
              color: "#111827",
            }}
          >
            Welcome to{" "}
            <span style={{ color: "#2563eb" }}>
              {displayedName}
              <span
                style={{
                  display: "inline-block",
                  width: "3px",
                  height: "1em",
                  background: "#2563eb",
                  marginLeft: "2px",
                  verticalAlign: "middle",
                  borderRadius: "2px",
                  animation: "blink 0.75s step-end infinite",
                }}
              />
            </span>
          </h1>

          <style>{`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>

          <p
            style={{
              fontSize: "18px",
              color: "#4b5563",
              lineHeight: 1.8,
              marginBottom: "24px",
            }}
          >
            We are committed to providing quality education, a safe learning
            environment, and strong values for every student. Our school system
            supports students, teachers, and administrators with modern digital
            management tools.
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          </div>
        </div>

        <div>
          <div
            style={{
              height: "350px",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              background: "#e5e7eb",
            }}
          >
            {settings.banner_url ? (
              <img
                src={settings.banner_url}
                alt="School Banner"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1e3a8a",
                  fontSize: "24px",
                  fontWeight: "700",
                  background:
                    "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)",
                }}
              >
                {loading ? "Loading..." : "School Banner / Logo"}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 32px 48px",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginBottom: "20px", color: "#111827" }}
        >
          About Our School
        </h2>

        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            color: "#4b5563",
            lineHeight: 1.8,
          }}
        >
          Our school focuses on academic excellence, student discipline,
          personal growth, and community values. We believe that every child
          deserves an inspiring environment to learn, grow, and succeed.
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 32px 48px",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginBottom: "20px", color: "#111827" }}
        >
          Our Commitment
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Quality Education</h3>
            <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
              We provide a strong academic foundation with modern learning
              methods.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Safe Environment</h3>
            <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
              We create a respectful, secure, and supportive environment for all
              students.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Student Development</h3>
            <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
              We support students not only in academics but also in character
              and responsibility.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 32px 64px",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginBottom: "20px", color: "#111827" }}
        >
          Contact Us
        </h2>

        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            lineHeight: 1.8,
            color: "#4b5563",
          }}
        >
          <p>
            <strong>School Name:</strong> {settings.school_name}
          </p>
          <p>
            <strong>Phone:</strong> {settings.school_phone || "-"}
          </p>
          <p>
            <strong>Email:</strong> {settings.school_email || "-"}
          </p>
          <p>
            <strong>Address:</strong> {settings.school_address || "-"}
          </p>
        </div>
      </section>

      <footer
        style={{
          background: "#111827",
          color: "#fff",
          textAlign: "center",
          padding: "20px",
        }}
      >
        © 2026 {settings.school_name}. All rights reserved.
      </footer>
    </div>
  );
}