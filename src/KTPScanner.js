import React, { useEffect, useRef, useState } from "react";
import styless from "./Dashboard.module.css";

import { useNavigate } from "react-router-dom";

import Modal from "./Modal";
import PaginatedFormEditable from "./PaginatedFormEditable";

const STORAGE_KEY = "camera_canvas_gallery";

const CameraCanvas = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [fileTemp, setFileTemp] = useState(null);
  const [isFreeze, setIsFreeze] = useState(false);
  const freezeFrameRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [KTPdetected, setKTPdetected] = useState(false);
  const [isScanned, setIsScanned] = useState(false); // New state to track if scan is completed
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // New state for success message

  const fileInputRef = useRef(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadImageToCanvas = (src, width, height) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      };
    });
  };

  const rectRef = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 20,
  });

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const fillOutsideRect = (ctx, rect, canvasWidth, canvasHeight) => {
    ctx.save();
    const { x, y, width, height, radius } = rect;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "rgba(173, 173, 173, 1)";
    ctx.fill("evenodd");
    ctx.restore();
  };

  useEffect(() => {
    const savedGallery = localStorage.getItem(STORAGE_KEY);
    if (savedGallery) setGalleryImages(JSON.parse(savedGallery));

    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const hiddenCanvas = hiddenCanvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.style.maxWidth = "100%";
            canvas.style.height = "auto";

            hiddenCanvas.width = video.videoWidth;
            hiddenCanvas.height = video.videoHeight;

            const rectWidth = canvas.width * 0.9;
            const rectHeight = (53.98 / 85.6) * rectWidth;
            const rectX = (canvas.width - rectWidth) / 2;
            const rectY = (canvas.height - rectHeight) / 2;

            rectRef.current = {
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              radius: 20,
            };

            const drawToCanvas = () => {
              if (video.readyState === 4) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (isFreeze && freezeFrameRef.current) {
                  ctx.putImageData(freezeFrameRef.current, 0, 0);
                } else {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                drawRoundedRect(
                  ctx,
                  rectRef.current.x,
                  rectRef.current.y,
                  rectRef.current.width,
                  rectRef.current.height,
                  rectRef.current.radius
                );
                if (isFreeze) {
                  fillOutsideRect(
                    ctx,
                    rectRef.current,
                    canvas.width,
                    canvas.height
                  );
                }
              }
              requestAnimationFrame(drawToCanvas);
            };

            drawToCanvas();
          };
        }
      } catch (err) {
        console.error("Gagal mendapatkan kamera:", err);
      }
    };

    getCameraStream();
  }, [isFreeze]);

  const shootImage = async () => {
    const video = videoRef.current;
    const { x, y, width, height } = rectRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const hiddenCtx = hiddenCanvas.getContext("2d");
    const visibleCtx = canvasRef.current.getContext("2d");

    freezeFrameRef.current = visibleCtx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setIsFreeze(true);
    setLoading(true);

    hiddenCtx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.floor(width);
    cropCanvas.height = Math.floor(height);
    const cropCtx = cropCanvas.getContext("2d");

    cropCtx.drawImage(
      hiddenCanvas,
      Math.floor(x),
      Math.floor(y),
      Math.floor(width),
      Math.floor(height),
      0,
      0,
      Math.floor(width),
      Math.floor(height)
    );

    const imageDataUrl = cropCanvas.toDataURL("image/png", 1.0);
    setCapturedImage(imageDataUrl);

    setKTPdetected(true);
    setLoading(false);
    // Continue to OCR etc...
  };

  function base64ToFile(base64Data, fileName) {
    const arr = base64Data.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }

  const ReadImage = async (capturedImage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Ubah base64 ke file
      const file = base64ToFile(capturedImage, "image.jpg");

      // Gunakan FormData
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/mastersnapper/read",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      setLoading(false);

      const data = await res.json();
      if (data.responseCode == 409) {
        console.log(409);
        setFileTemp({ error: 409 });
        setIsScanned(true); // Set scanned to true even for error case
        return;
      }
      console.log(data);

      setFileTemp(data);
      setIsScanned(true); // Hide the review buttons after successful scan
    } catch (error) {
      console.error("Failed to read image:", error);
      setIsScanned(true); // Hide buttons even on error
    }
  };

  const handleSaveTemp = async (verifiedData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();

      // Tambahkan data terverifikasi sebagai JSON string
      formData.append("data", JSON.stringify(verifiedData));

      const res = await fetch(
        "https://bot.kediritechnopark.com/webhook/mastersnapper/save",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Jangan set Content-Type secara manual untuk FormData
          },
          body: formData,
        }
      );

      setLoading(false);
      setFileTemp(null);
      setShowSuccessMessage(true); // Show success message

      // Hide success message after 3 seconds and reset states
      setTimeout(() => {
        setShowSuccessMessage(false);
        setIsFreeze(false);
        setIsScanned(false);
        setCapturedImage(null);
      }, 3000);
    } catch (err) {
      console.error("Gagal menyimpan ke server:", err);
      setLoading(false);
    }
  };

  const handleDeleteTemp = async () => {
    try {
      await fetch(
        "https://bot.kediritechnopark.com/webhook/mastersnapper/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileTemp }),
        }
      );

      setFileTemp(null);
    } catch (err) {
      console.error("Gagal menghapus dari server:", err);
    }
  };

  const removeImage = (index) => {
    const newGallery = [...galleryImages];
    newGallery.splice(index, 1);
    setGalleryImages(newGallery);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGallery));
  };

  const aspectRatio = 53.98 / 85.6;

  const handleManualUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUrl = reader.result;
      setCapturedImage(imageDataUrl);
      setIsFreeze(true);

      const image = new Image();
      image.onload = async () => {
        const rectWidth = rectRef.current.width;
        const rectHeight = rectRef.current.height;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (isFreeze && freezeFrameRef.current) {
          ctx.putImageData(freezeFrameRef.current, 0, 0);
        } else {
          const video = videoRef.current;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        drawRoundedRect(
          ctx,
          rectRef.current.x,
          rectRef.current.y,
          rectRef.current.width,
          rectRef.current.height,
          rectRef.current.radius
        );

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(
          rectRef.current.x + rectRef.current.radius,
          rectRef.current.y
        );
        ctx.lineTo(
          rectRef.current.x + rectRef.current.width - rectRef.current.radius,
          rectRef.current.y
        );
        ctx.quadraticCurveTo(
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y,
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y + rectRef.current.radius
        );
        ctx.lineTo(
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y + rectRef.current.height - rectRef.current.radius
        );
        ctx.quadraticCurveTo(
          rectRef.current.x + rectRef.current.width,
          rectRef.current.y + rectRef.current.height,
          rectRef.current.x + rectRef.current.width - rectRef.current.radius,
          rectRef.current.y + rectRef.current.height
        );
        ctx.lineTo(
          rectRef.current.x + rectRef.current.radius,
          rectRef.current.y + rectRef.current.height
        );
        ctx.quadraticCurveTo(
          rectRef.current.x,
          rectRef.current.y + rectRef.current.height,
          rectRef.current.x,
          rectRef.current.y + rectRef.current.height - rectRef.current.radius
        );
        ctx.lineTo(
          rectRef.current.x,
          rectRef.current.y + rectRef.current.radius
        );
        ctx.quadraticCurveTo(
          rectRef.current.x,
          rectRef.current.y,
          rectRef.current.x + rectRef.current.radius,
          rectRef.current.y
        );
        ctx.closePath();
        ctx.clip();

        // === Object-Fit: Cover Logic ===
        const imageAspectRatio = image.width / image.height;
        const rectAspectRatio = rectWidth / rectHeight;

        let sx, sy, sWidth, sHeight;

        if (imageAspectRatio > rectAspectRatio) {
          // Image is wider than rect
          sHeight = image.height;
          sWidth = sHeight * rectAspectRatio;
          sx = (image.width - sWidth) / 2;
          sy = 0;
        } else {
          // Image is taller than rect
          sWidth = image.width;
          sHeight = sWidth / rectAspectRatio;
          sx = 0;
          sy = (image.height - sHeight) / 2;
        }

        ctx.drawImage(
          image,
          sx,
          sy,
          sWidth,
          sHeight,
          rectRef.current.x,
          rectRef.current.y,
          rectWidth,
          rectHeight
        );
        // ==============================

        ctx.restore();

        freezeFrameRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = rectWidth;
        cropCanvas.height = rectHeight;
        const cropCtx = cropCanvas.getContext("2d");

        cropCtx.drawImage(
          canvas,
          rectRef.current.x,
          rectRef.current.y,
          rectWidth,
          rectHeight,
          0,
          0,
          rectWidth,
          rectHeight
        );

        setKTPdetected(true);
      };
      image.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleHapus = () => {
    setFileTemp(null);
    setIsFreeze(false);
    setIsScanned(false);
    setCapturedImage(null);
    setShowSuccessMessage(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div>
      <div className={styless.dashboardHeader}>
        <div className={styless.logoAndTitle}>
          <img src="/PSI.png" alt="Bot Avatar" />
          <h1 className={styless.h1}>Kawal PSI Dashboard</h1>
        </div>

        <div className={styless.dropdownContainer} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={styless.dropdownToggle}
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-haspopup="true"
          >
            <svg
              width="15"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className={styless.dropdownMenu}>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsMenuOpen(false);
                }}
                className={styless.dropdownItem}
              >
                Profile
              </button>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMenuOpen(false);
                }}
                className={styless.dropdownItem}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className={styless.dropdownItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
      <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

      <div
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          textAlign: "center",
          bottom: 0,
          width: "100%",
          position: "absolute",
          padding: "20px",
        }}
      >
        {showSuccessMessage ? (
          <div
            style={{
              padding: "20px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#22c55e",
              textAlign: "center",
            }}
          >
            Data berhasil disimpan
          </div>
        ) : !isFreeze ? (
          <>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "50px" }}
            >
              <div
                style={{
                  padding: 10,
                  backgroundColor: "#ef4444",
                  borderRadius: 15,
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={shootImage}
              >
                Ambil Gambar
              </div>
              <div
                style={{
                  padding: 10,
                  backgroundColor: "#ef4444",
                  borderRadius: 15,
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={triggerFileSelect}
              >
                Upload Gambar
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleManualUpload(e)}
              style={{ display: "none" }}
            />
          </>
        ) : loading ? (
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner} />
            <style>{spinnerStyle}</style>
          </div>
        ) : (
          capturedImage &&
          (!fileTemp || fileTemp.error == undefined) &&
          !isScanned && ( // Hide when isScanned is true
            <div>
              <h4 style={{ marginTop: 0 }}>Tinjau Gambar</h4>
              <div
                style={{
                  padding: 10,
                  backgroundColor: "#ef4444",
                  borderRadius: 15,
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
                onClick={() => ReadImage(capturedImage)}
              >
                Scan
              </div>

              <h4 style={{ cursor: "pointer" }} onClick={handleHapus}>
                Hapus
              </h4>
            </div>
          )
        )}
        {fileTemp && fileTemp.error != "409" ? (
          <PaginatedFormEditable
            data={fileTemp}
            handleSimpan={(data) => handleSaveTemp(data)}
          />
        ) : (
          fileTemp && (
            <>
              <h4>KTP Sudah Terdaftar</h4>
              <h4 style={{ cursor: "pointer" }} onClick={handleHapus}>
                Hapus
              </h4>
            </>
          )
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        loading={loading}
        fileTemp={fileTemp}
        onSave={handleSaveTemp}
        onDelete={handleDeleteTemp}
      />
    </div>
  );
};

const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const styles = {
  spinnerContainer: {
    textAlign: "center",
    padding: 40,
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: 40,
    height: 40,
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
};

export default CameraCanvas;
