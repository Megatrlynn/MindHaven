import { Brain, Facebook, Twitter, Linkedin, Instagram, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 py-12 text-slate-100">
      <div className="content-shell">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-4 md:text-left">
          <div>
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold md:justify-start">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-700 pulse-primary">
                <Brain className="h-5 w-5 text-white" />
              </span>
              MindHaven
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-300 md:max-w-none">
              Connecting people with trusted care professionals and accessible support resources.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-slate-300 transition-colors hover:text-cyan-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-slate-300 transition-colors hover:text-cyan-300">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <div className="mt-3 flex justify-center gap-3 md:justify-start">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-300"
                  aria-label="Social media link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <Phone className="h-4 w-4 text-cyan-300" />
                +250 780 000 000
              </li>
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <Mail className="h-4 w-4 text-cyan-300" />
                support@mindhaven.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-700/70 pt-6">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} MindHaven. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

  );
};

export default Footer;
