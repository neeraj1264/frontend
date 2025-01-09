// CustomerDetail.js
import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { handleScreenshot } from "../Utils/DownloadPng"; // Import the function
import "./Customer.css";
// import { handleScreenshotAsPDF } from "../Utils/DownloadPdf";
import Header from "../header/Header";
import { sendorder, setdata } from "../../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "bottom-right",
  autoClose: 2000,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};
const CustomerDetail = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [productsToSend, setproductsToSend] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [orders, setOrders] = useState([]);
  const getdeliveryCharge = localStorage.getItem("deliveryCharge");
  const deliveryChargeAmount = parseFloat(getdeliveryCharge) || 0;

  const invoiceRef = useRef(); // Reference to the hidden invoice content
  const navigate = useNavigate();

  useEffect(() => {
    // Load selected products and total amount from localStorage
    const storedProducts =
      JSON.parse(localStorage.getItem("productsToSend")) || [];
    const storedAmount = parseFloat(localStorage.getItem("totalAmount")) || 0;
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(savedOrders);

    setproductsToSend(storedProducts);
    setTotalAmount(storedAmount);
  }, []);

  const handleSendToWhatsApp = () => {
    // Calculate the current total amount from productsToSend
    const currentTotalAmount =
      calculateTotalPrice(productsToSend) + deliveryChargeAmount;

    // Map product details into a formatted string
    const productDetails = productsToSend
      .map((product) => {
        const quantity = product.quantity || 1;
        const size = product.size ? ` ${product.size}` : ""; // Include size only if it exists
        return `${quantity}.0 x ${product.name}${size} = ₹${
          product.price * quantity
        }`;
      })
      .join("\n"); // Join product details with a single newline

    // Check if deliveryCharge exists
    const serviceChargeText = deliveryCharge
      ? `Service Charge: ₹${deliveryChargeAmount}` // No extra newline
      : "";

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Construct the WhatsApp message
    const message = encodeURIComponent(
      `Order: *${orderId}*` +
        (customerPhone ? `\nPhone: *${customerPhone}*` : "") +
        (customerName ? `\nName: *${customerName}*` : "") +
        (customerAddress ? `\nAddress: *${customerAddress}*` : "") +
        `\nAmount: *₹${currentTotalAmount}*` +
        `\n\n----------item----------\n${productDetails}` + // No extra newline here
        (serviceChargeText ? `\n${serviceChargeText}` : "") // Add only if serviceChargeText exists
    );

    const phoneNumber = customerPhone;

    const formattedPhoneNumber = phoneNumber
      ? `+91${phoneNumber}` // Prepend +91 for India if the phone number is present
      : phoneNumber;

    if (phoneNumber) {
      window.open(
        `https://wa.me/${formattedPhoneNumber}?text=${message}`,
        "_blank"
      );
    } else {
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSendClick = async () => {
    const productsToSend = JSON.parse(localStorage.getItem("productsToSend"));
    if (!productsToSend || productsToSend.length === 0) {
      toast.error(
        "Please add product before proceed",
        toastOptions
      );
      return; // Exit the function early
    }

    setShowPopup(true);

    if (deliveryCharge) {
      localStorage.setItem("deliveryCharge", deliveryCharge);
    }

    const orderId = `order_${Date.now()}`;

    // Create an order object
    const order = {
      id: orderId,
      products: productsToSend,
      totalAmount: calculateTotalPrice(productsToSend) + deliveryChargeAmount,
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      timestamp: new Date().toISOString(),
    };

    const customerDataObject = {
      id: orderId,
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      timestamp: new Date().toISOString(),
    };

    // Get the current orders from localStorage
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];

    // Add the new order to the list
    savedOrders.push(order);

    // Save the updated orders back to localStorage
    localStorage.setItem("orders", JSON.stringify(savedOrders));

    try {
      // Send the order to your backend to be saved in MongoDB
      const data = await sendorder(order);
      console.log("Order created:", data);

      // You can clear localStorage or perform any other actions as needed
      // localStorage.removeItem("products"); // Example
    } catch (error) {
      console.error("Error sending order:", error.message);
    }

    try {
      const customerDataResponse = await setdata(customerDataObject);
      if (
        customerDataResponse.message ===
        "Customer already exists, no changes made."
      ) {
        console.log(
          "Customer already exists in the database, no need to add again."
        );
      } else {
        console.log("Customer Data Added", customerDataResponse);
      }
    } catch (error) {
      console.error("Error sending customer data:", error.message);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);

    // Navigate to the invoice page
    navigate("/invoice");

    window.location.reload();
  };

  const handlePngDownload = () => {
    // Show the hidden invoice, take the screenshot, and then hide it again
    invoiceRef.current.style.display = "block";
    setTimeout(() => {
      handleScreenshot("invoice");
      invoiceRef.current.style.display = "none";
    }, 10);
  };

  const convertImageToBase64 = (imagePath) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "Anonymous"; // To handle cross-origin issues if needed
      image.src = imagePath;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = (error) => reject(error);
    });
  };

  const MobilePrint = async () => {
    try {
      // Convert both logo and QR code to Base64
      const logoBase64 = await convertImageToBase64("/logo.png");
      const qrBase64 = await convertImageToBase64("/qr.png");

      const kotContent = document.getElementById("mobileinvoice").innerHTML;

      const newWindow = window.open("", "", "width=600,height=400");
      newWindow.document.write(`
        <html>
          <head>
            <title>KOT</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                margin: 3rem 0;
                padding: 0;
                width: 48mm;
              }
              table {
                width: 94%;
                border-collapse: collapse;
              }
              th, td {
                border: 2px solid black;
                padding: 2px;
                text-align: left;
                font-size: 10px;
                font-weight: bold;
              }
              .total {
                font-size: 13px;
                text-align: left;
                margin-top: 4px;
              }
              .totalAmount {
                font-size: 15px;
                font-weight: 800;
                border: 2px dashed;
                text-align: center;
                background: black;
                color: white;
                padding: 0.4rem;
              }
              .logo {
                display: flex;
                margin: auto;
              }
              .logo img {
                width: 40px;
                height: auto;
              }
              hr {
                border: 2px dashed;
              }
            </style>
          </head>
          <body>
            ${kotContent}
          </body>
        </html>
      `);

      newWindow.document.close();

      newWindow.onload = () => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      };
    } catch (error) {
      console.error("Error generating printable content:", error);
    }
  };

  // Helper function to calculate total price
  const calculateTotalPrice = (products = []) => {
    return products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  // Handle customer phone input validation
  const handlePhoneChange = (e) => {
    const phoneValue = e.target.value;

    // Only allow numeric input and ensure length is <= 10
    if (/^\d*$/.test(phoneValue) && phoneValue.length <= 10) {
      setCustomerPhone(phoneValue);
    }

   
  };

  const handleRawBTPrint = () => {
    const hasDeliveryCharge = getdeliverycharge !== 0; // Check if delivery charge exists

    // Map product details into a formatted string
    const productDetails = productsToSend
      .map((product) => {
        const productSize = product.size ? `(${product.size})` : ""; // Include size if available
        return `${product.name} ${productSize} - ₹${product.price} x ${product.quantity}`;
      })
      .join("\n"); // Join product details with a single newline

    const invoiceText = `
    \x1B\x21\x30Foodies Hub\x1B\x21\x00  
  Pehowa, Haryana, 136128
  Phone: +91 70158-23645
  
   \x1B\x21\x10-----Invoice Details-----\x1B\x21\x00 
  Bill No: #${Math.floor(1000 + Math.random() * 9000)}
  Date: ${
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Enables 12-hour format
    })
  }
  
  Customer: ${customerName || "Guest Customer"}
  Phone: ${customerPhone || "N/A"}
  Address: ${customerAddress || "N/A"}
  
  \x1B\x21\x10     -----Items-----     \x1B\x21\x00 
 ${productDetails}
     ${
       hasDeliveryCharge
         ? `Item Total: ₹${calculateTotalPrice(productsToSend).toFixed(2)}`
         : " "
     }
  ${
    hasDeliveryCharge ? `Service Charge: ₹${getdeliverycharge.toFixed(2)}` : " "
  }

  \x1B\x21\x30Total: ₹${
    calculateTotalPrice(productsToSend) + getdeliverycharge
  }\x1B\x21\x00
  
  ---------------------------
  \x1B\x21\x10Thank You Visit Again!\x1B\x21\x00
    Powered by BillZo
  `;

    // Send the content to RawBT (add more parameters if required)
    const encodedText = encodeURIComponent(invoiceText);
    const rawBTUrl = `intent:${encodedText}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.text=${encodedText};end;`;

    // Trigger RawBT
    window.location.href = rawBTUrl;
  };

  const getdeliverycharge = localStorage.getItem("deliveryCharge")
    ? parseFloat(localStorage.getItem("deliveryCharge"))
    : 0; // Default to 0 if not set
  return (
    <div>
      <ToastContainer />
      <Header />
      <div className="cust-inputs" style={{ marginTop: "4rem" }}>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name..."
        />
      </div>
      <div className="cust-inputs">
        <input
          type="text"
          value={customerPhone}
          onChange={handlePhoneChange}
          placeholder="Customer phone..."
        />
      </div>
      <div className="cust-inputs">
        <input
          type="text"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          placeholder="Customer address..."
        />
      </div>
      <div className="cust-inputs">
        <input
          type="number"
          value={deliveryCharge}
          onChange={(e) => setDeliveryCharge(e.target.value)}
          placeholder="Delivery charge..."
        />
      </div>
      {/* Hidden Invoice Content */}
      <div
        className="invoice-content"
        id="invoice"
        ref={invoiceRef}
        style={{ display: "none" }}
      >
        <img src="/logo.png" alt="Logo" width={100} className="logo" />
        <h1 style={{ textAlign: "center", margin: 0, fontSize: "25px" }}>
          Foodies Hub
        </h1>
        <p style={{ textAlign: "center", margin: 0, fontSize: "15px" }}>
          Pehowa, Haryana, 136128
        </p>
        <p style={{ textAlign: "center", margin: 0, fontSize: "15px" }}>
          Phone Number - +91 70158-23645
        </p>
        <hr />
        <h2 style={{ textAlign: "center", margin: 0, fontSize: "20px" }}>
          Invoice Details
        </h2>
        <div className="customer-info">
          {/* Bill No and Date */}
          <p style={{ fontSize: "15px" }}>
            Bill
            No&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {`#${Math.floor(1000 + Math.random() * 9000)}`}{" "}
            {/* Random 6-digit bill number */}
          </p>
          <p style={{ fontSize: "15px" }}>
            Created
            On&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) +
              " " +
              new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true, // Enables 12-hour format
              })}
          </p>

          <p style={{ fontSize: "15px" }}>
            Customer Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {customerName ? customerName : "Guest Customer"}
          </p>
          <p style={{ fontSize: "15px" }}>
            Phone Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -
            &nbsp;&nbsp;&nbsp;&nbsp;{customerPhone ? customerPhone : "...."}
          </p>
          <p style={{ fontSize: "15px" }}>
            Address&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {customerAddress ? customerAddress : "...."}
          </p>
        </div>
        <table>
          <thead>
            <tr className="productname">
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {productsToSend.map((product, index) => (
              <tr key={index} className="productdetail">
                <td>
                  {product.size
                    ? `${product.name} (${product.size})`
                    : product.name}
                </td>
                <td style={{ textAlign: "Center" }}>{product.quantity || 1}</td>
                <td style={{ textAlign: "Center" }}>₹{product.price}</td>
                <td style={{ textAlign: "Center" }}>
                  ₹{product.price * (product.quantity || 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="total">
          {/* <p>
            Item Total:{" "}
            <span>
              ₹
              {productsToSend
                .reduce(
                  (sum, product) =>
                    sum + product.price * (product.quantity || 1),
                  0
                )
                .toFixed(2)}
            </span>
          </p> */}
          {/* <p>
            Service Charge: <span>₹20.00</span>
          </p> */}
        </div>
        <p className="totalAmount">
          NetTotal: ₹
          {productsToSend
            .reduce(
              (sum, product) => sum + product.price * (product.quantity || 1),
              0
            )
            .toFixed(2)}
        </p>{" "}
      </div>
      {/* mobile print content */}
      <div
        className="invoice-content"
        id="mobileinvoice"
        // ref={invoiceRef}
        style={{ display: "none" }}
      >
        <img src="/logo.png" alt="Logo" width={100} className="logo" />
        <h1 style={{ textAlign: "center", margin: 0, fontSize: "25px" }}>
          Foodies Hub
        </h1>
        <p
          style={{
            textAlign: "center",
            margin: 0,
            fontSize: "14px",
            padding: "0 2px",
          }}
        >
          Pehowa, Haryana, 136128
        </p>
        <p style={{ textAlign: "center", margin: 0, fontSize: "14px" }}>
          +91 70158-23645
        </p>
        <hr />
        <h2 style={{ textAlign: "center", margin: 0, fontSize: "20px" }}>
          Invoice Details
        </h2>
        <div className="customer-info">
          <p style={{ fontSize: "15px" }}>
            Bill No&nbsp;&nbsp;-&nbsp;&nbsp;
            {`#${Math.floor(1000 + Math.random() * 9000)}`}{" "}
            {/* Random 6-digit bill number */}
          </p>
          <p style={{ fontSize: "13px" }}>
            Created On:&nbsp;
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) +
              " " +
              new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true, // Enables 12-hour format
              })}
          </p>

          {customerName && (
            <p style={{ fontSize: "12px" }}>
              Customer Name &nbsp;- &nbsp;{customerName}
            </p>
          )}
          {customerPhone && (
            <p style={{ fontSize: "12px" }}>
              Phone Number &nbsp;- &nbsp;{customerPhone}
            </p>
          )}
          {customerAddress && (
            <p style={{ fontSize: "13px" }}>
              Address&nbsp;-&nbsp;{customerAddress}
            </p>
          )}
        </div>
        <table>
          <thead>
            <tr className="productname">
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {productsToSend.map((product, index) => (
              <tr key={index} className="productdetail">
                <td>
                  {product.size
                    ? `${product.name} (${product.size})`
                    : product.name}
                </td>
                <td style={{ textAlign: "Center" }}>{product.quantity || 1}</td>
                <td style={{ textAlign: "Center" }}>₹{product.price}</td>
                <td style={{ textAlign: "Center" }}>
                  ₹{product.price * (product.quantity || 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {getdeliverycharge !== 0 && (
          <>
            <div className="total">
              <p>
                Item Total{" "}
                <span>
                  ₹{" "}
                  {productsToSend
                    .reduce(
                      (sum, product) =>
                        sum + product.price * (product.quantity || 1),
                      0
                    )
                    .toFixed(2)}
                </span>
              </p>
            </div>
            <div className="total">
              <p>
                Service Charge: <span>₹{getdeliverycharge.toFixed(2)}</span>
              </p>
            </div>
          </>
        )}
        <p className="totalAmount">
          Net Total: ₹
          {(
            productsToSend.reduce(
              (sum, product) => sum + product.price * (product.quantity || 1),
              0
            ) + getdeliverycharge
          ).toFixed(2)}
        </p>{" "}
        <div
          style={{
            textAlign: "center",
            fontSize: "15px",
            paddingBottom: "2rem",
          }}
        >
          Thank You!
        </div>
        <hr />
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {" "}
          Order Online
        </div>
        <img
          src="/qr.png"
          alt="QR Code"
          style={{ width: "80%", display: "flex", margin: "2px auto" }}
        />
      </div>
      <button onClick={handleSendClick} className="done">
        Send <FaArrowRight className="Invoice-arrow" />
      </button>
      {/* Modal Popup */}
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <h2>Select Action</h2>
            <button onClick={handleSendToWhatsApp} style={styles.popupButton}>
              Send to WhatsApp
            </button>
            <button onClick={handlePngDownload} style={styles.popupButton}>
              Download Invoice
            </button>
            <button onClick={handleRawBTPrint} style={styles.popupButton}>
              Mobile Print
            </button>
            <button onClick={MobilePrint} style={styles.popupButton}>
              Usb Print
            </button>

            <button onClick={handleClosePopup} style={styles.popupCloseButton}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
  },
  popupButton: {
    display: "block",
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
  popupCloseButton: {
    marginTop: "10px",
    backgroundColor: "red",
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default CustomerDetail;
