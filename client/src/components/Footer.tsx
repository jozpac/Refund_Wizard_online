export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          {/* Links */}
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <a
              href="https://go.viralprofits.yt/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700"
            >
              Privacy Policy
            </a>
            <span>|</span>
            <a
              href="https://go.viralprofits.yt/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700"
            >
              Terms and conditions
            </a>
          </div>

          {/* Support Email */}
          <div className="text-sm text-gray-500">
            Support:{" "}
            <a
              href="mailto:hello@viralprofits.yt"
              className="text-blue-600 hover:text-blue-700"
            >
              hello@viralprofits.yt
            </a>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-400 leading-relaxed max-w-4xl mx-auto space-y-3">
            <p>
              Earnings and income representations made by Jake Tran, and their
              advertisers/sponsors are aspirational statements only of your
              earnings potential. The success of Jake Tran, testimonials and
              other examples used are exceptional, non-typical results and are
              not intended to be and are not a guarantee that you or others will
              achieve the same results. Individual results will always vary and
              yours will depend entirely on your individual capacity, work
              ethic, business skills and experience, level of motivation,
              diligence, the economy, the normal and unforeseen risks of doing
              business, and other factors.
            </p>

            <p>
              By using this website or any related materials you agree to take
              full responsibility for your own results, or lack thereof. Our
              team is here to support you, but you should always do your own due
              diligence before making any investment or taking any risk.
            </p>

            <p>
              This site is not a part of the YouTube website or YouTube, LLC.
              This site is NOT endorsed by YouTube in any way. YOUTUBE is a
              trademark of YouTube, LLC, a subsidiary of Google, Inc.
            </p>

            <p>
              This site is not a part of the Facebook™ website or Facebook™
              Inc. This site is NOT endorsed by Facebook™ in any way.
              FACEBOOK™ is a trademark of FACEBOOK™, Inc.
            </p>

            <p>
              This site is not a part of TikTok™ or ByteDance Ltd. This site is
              NOT endorsed by TikTok™ or ByteDance Ltd. in any way. TIKTOK™ is
              a trademark of ByteDance Ltd.
            </p>

            <p>
              You should know that all products and services by our company are
              for educational and informational purposes only. Nothing on this
              page, any of our websites, or any of our content or curriculum is
              a promise or guarantee of results or future earnings, and we do
              not offer any legal, medical, tax or other professional advice. If
              you have any questions or need further information, please email
              us at.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
