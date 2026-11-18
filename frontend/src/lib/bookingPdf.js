import jsPDF from "jspdf";

export function downloadBookingPdf(booking, user, payment = null) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 20;
  const right = pageWidth - 20;
  let y = 25;

  const addLine = () => {
    doc.setDrawColor(210, 210, 210);
    doc.line(left, y, right, y);
    y += 10;
  };

  const addDetail = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, left, y);

    doc.setFont("helvetica", "normal");

    const text = String(value ?? "—");
    const lines = doc.splitTextToSize(text, 85);

    doc.text(lines, 95, y);
    y += Math.max(9, lines.length * 7);
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("VENUVA", pageWidth / 2, y, { align: "center" });

  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("BOOKING CONFIRMATION", pageWidth / 2, y, {
    align: "center",
  });

  y += 12;
  addLine();

  // Booking information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BOOKING DETAILS", left, y);
  y += 10;

  addDetail("Booking Reference", booking.id);
  addDetail("Booking Status", booking.status);
  addDetail("Venue Name", booking.venueName);
  addDetail("Venue Location", booking.location);
  addDetail("Event Date", booking.date);
  addDetail("Starting Time", booking.startTime);
  addDetail("Ending Time", booking.endTime);
  addDetail("Duration", `${booking.hours} hours`);

  y += 3;
  addLine();

  // Customer information
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS", left, y);
  y += 10;

  addDetail("Customer Name", user?.username);
  addDetail("Email", user?.email);

  y += 3;
  addLine();

  // Payment information
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", left, y);
  y += 10;

  addDetail("Payment Status", payment?.payment_status ?? booking.paymentStatus);
  addDetail(
    "Payment ID",
    payment?.razorpay_payment_id ?? "Not available"
  );
  addDetail(
    "Payment Date",
    payment?.paid_at
      ? new Date(payment.paid_at).toLocaleString()
      : "—"
  );

  y += 3;
  addLine();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Total Amount", left, y);

  doc.text(
    `INR ${Number(booking.total).toFixed(2)}`,
    right,
    y,
    { align: "right" }
  );

  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Thank you for choosing Venuva!",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  doc.save(`Venuva-Booking-${booking.id}.pdf`);
}