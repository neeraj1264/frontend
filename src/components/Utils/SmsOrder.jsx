import React from "react";

const SmsOrder = ({
  productsToSend = [],
  deliveryChargeAmount = 0,
  parsedDiscount = 0,
  customerPhone = "",
  customerAddress = "",
  restaurantName = "",
}) => {
  // Build the message body
  const buildBody = () => {
    const lines = [];
    if (restaurantName) lines.push(restaurantName);
    lines.push("Order Details:");
    productsToSend.forEach((p) => {
      const qty = p.quantity || 1;
      lines.push(`${p.name} x${qty} = ₹${(p.price * qty).toFixed(2)}`);
    });
    if (deliveryChargeAmount) {
      lines.push(`Delivery: ₹${deliveryChargeAmount.toFixed(2)}`);
    }
    if (parsedDiscount) {
      lines.push(`Discount: -₹${parsedDiscount.toFixed(2)}`);
    }
    const total =
      productsToSend.reduce(
        (sum, p) => sum + p.price * (p.quantity || 1),
        0
      ) +
      deliveryChargeAmount -
      parsedDiscount;
    lines.push(`Total: ₹${total.toFixed(2)}`);
    if (customerAddress) {
      lines.push(`Address: ${customerAddress}`);
    }
    return encodeURIComponent(lines.join("\n"));
  };

  // SMS deep-link URI
const href = customerPhone ? `sms:${customerPhone}?body=${buildBody()}` : "#";

  return (
    <a href={href}>
      <button type="button" className="popupButton">
        SMS
      </button>
    </a>
  );
};

export default SmsOrder;
