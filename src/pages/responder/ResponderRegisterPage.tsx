import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  User,
  FileBadge,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { registerResponder } from "../../lib/api";
import { Responder } from "../../types";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import L from "leaflet";

export const ResponderRegisterPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    orgName: "",
    type: "hospital" as Responder["type"],
    licenseNo: "",
    contactPerson: "",
    phone: "+91 98450 11223",
    email: "",
    address: "Bengaluru Metropolitan Area",
    lat: 12.9634,
    lng: 77.5755,
    open24x7: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResponder, setRegisteredResponder] = useState<Responder | null>(null);

  // Map Picker ref
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Initialize interactive map for pin picker
  useEffect(() => {
    if (!mapContainerRef.current || registeredResponder) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [formData.lat, formData.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "custom-station-pin",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 rounded-full bg-emerald-500 opacity-75 pulse-marker-ring"></div>
            <div class="relative w-5 h-5 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-[10px] text-white font-bold">H</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([formData.lat, formData.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setFormData((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
        }));
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setFormData((prev) => ({
          ...prev,
          lat: Number(pos.lat.toFixed(5)),
          lng: Number(pos.lng.toFixed(5)),
        }));
      });

      mapInstanceRef.current = map;
      pinMarkerRef.current = marker;
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [registeredResponder]);

  // E.164 phone validation helper
  const validatePhone = (phone: string): boolean => {
    // Allows standard international E.164 formats like +919845012345 or with spaces/dashes
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return /^\+?[1-9]\d{7,14}$/.test(cleaned);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleValidateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.orgName.trim()) {
      newErrors.orgName = "Organization name is required";
    }
    if (!formData.licenseNo.trim()) {
      newErrors.licenseNo = "Registration/License number is required";
    }
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person name is required";
    }
    if (!formData.phone.trim() || !validatePhone(formData.phone)) {
      newErrors.phone = "Valid E.164 phone number required (e.g. +91 9845012345)";
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      newErrors.email = "Valid official email address required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Base address is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const created = await registerResponder({
        orgName: formData.orgName.trim(),
        type: formData.type,
        licenseNo: formData.licenseNo.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        lat: formData.lat,
        lng: formData.lng,
        open24x7: formData.open24x7,
      });

      setRegisteredResponder(created);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Responder registration error:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-lg mx-auto w-full pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/responder"
          className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Responder Inbox</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Authority Portal
        </span>
      </div>

      {registeredResponder ? (
        /* Verification Pending Success Screen */
        <Card className="border-emerald-500/30 bg-card p-6 space-y-5 text-center shadow-lg">
          <CardContent className="p-0 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="secondary" icon={<Clock className="w-3 h-3" />}>
                Verification Pending
              </Badge>
              <h2 className="text-base font-bold text-foreground">
                {t("verifPendingTitle")}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("verifPendingDesc")}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border text-left space-y-1 text-xs">
              <p className="font-bold text-foreground">{registeredResponder.orgName}</p>
              <p className="text-muted-foreground">License: {registeredResponder.licenseNo}</p>
              <p className="text-muted-foreground">Contact: {registeredResponder.contactPerson} ({registeredResponder.phone})</p>
              <p className="text-muted-foreground font-mono text-[11px]">ID: {registeredResponder.id}</p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="default"
                className="w-full"
                onClick={() => navigate("/responder")}
              >
                {t("goToInboxBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Registration Form */
        <form onSubmit={handleValidateAndSubmit} className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              {t("responderRegisterTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("responderRegisterSubtitle")}
            </p>
          </div>

          {/* Accountability Notice */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>{t("accountabilityNotice")}</span>
          </div>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 space-y-3.5">
              {/* Organization Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("orgNameLabel")} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    placeholder="e.g., Victoria Hospital Trauma Center"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {errors.orgName && <p className="text-[11px] text-red-500">{errors.orgName}</p>}
              </div>

              {/* Service Type Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("orgTypeLabel")} *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Responder["type"] })}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="hospital">{t("typeHospital")}</option>
                  <option value="ambulance">{t("typeAmbulance")}</option>
                  <option value="fire">{t("typeFire")}</option>
                  <option value="police">{t("typePolice")}</option>
                </select>
              </div>

              {/* License Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("licenseNoLabel")} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.licenseNo}
                    onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                    placeholder="e.g., KA-MED-9941 / BLR-TRAUMA-04"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  />
                  <FileBadge className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {errors.licenseNo && <p className="text-[11px] text-red-500">{errors.licenseNo}</p>}
              </div>

              {/* Contact Person */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("contactPersonLabel")} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g., Dr. R. Chandrashekar / Paramedic In-Charge"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {errors.contactPerson && <p className="text-[11px] text-red-500">{errors.contactPerson}</p>}
              </div>

              {/* Phone (E.164) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("phoneLabel")} *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  />
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {errors.phone && <p className="text-[11px] text-red-500">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("emailLabel")} *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="emergency@hospital.kar.nic.in"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {t("addressLabel")} *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Fort Road, near City Market, Bengaluru 560002"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {errors.address && <p className="text-[11px] text-red-500">{errors.address}</p>}
              </div>

              {/* Leaflet Pin Picker */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{t("mapPickerLabel")}</span>
                  </label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                  </span>
                </div>
                <div className="h-36 rounded-xl overflow-hidden border border-border relative">
                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>
              </div>

              {/* 24x7 Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs font-bold text-foreground">
                  {t("is24x7Label")}
                </span>
                <input
                  type="checkbox"
                  checked={formData.open24x7}
                  onChange={(e) => setFormData({ ...formData, open24x7: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit CTA */}
          <Button
            type="submit"
            variant="primary"
            size="cta"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t("submittingRegistration") : t("submitRegistration")}
          </Button>
        </form>
      )}
    </div>
  );
};
