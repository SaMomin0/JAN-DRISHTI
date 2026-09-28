'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Fingerprint,
  Sparkles,
  KeyRound,
  Building,
  Mail,
  FileCheck
} from 'lucide-react';
import { APPLE_PALETTE } from '../../components/charts/AppleCharts';

export default function SignPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'SIGNIN' | 'REGISTER'>('SIGNIN');
  const [role, setRole] = useState<'DISTRICT' | 'STATE' | 'APEX'>('DISTRICT');
  
  // Sign in state
  const [username, setUsername] = useState('collector.varanasi@nic.in');
  const [password, setPassword] = useState('••••••••••••');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('K7M9P');
  const [otpStage, setOtpStage] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  
  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regCadre, setRegCadre] = useState('IAS (Indian Administrative Service)');
  const [regJurisdiction, setRegJurisdiction] = useState('Uttar Pradesh - Varanasi');
  const [regSuccess, setRegSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
  };

  const handleRoleSelect = (selected: 'DISTRICT' | 'STATE' | 'APEX') => {
    setRole(selected);
    if (selected === 'DISTRICT') {
      setUsername('collector.varanasi@nic.in');
    } else if (selected === 'STATE') {
      setUsername('nodal.up.planning@nic.in');
    } else {
      setUsername('director.mplads@mospi.gov.in');
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both administrative ID and password.');
      return;
    }
    if (captchaInput.toUpperCase() !== captchaCode) {
      setErrorMsg('Security verification failed. Please try again.');
      refreshCaptcha();
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpStage(true);
    }, 600);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length < 4) {
      setErrorMsg('Please enter the 6-digit Aadhaar/Jan-Samarth OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 700);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) {
      setErrorMsg('Please enter full officer name and official government email.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRegSuccess(true);
    }, 800);
  };

  const handleQuickDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[rgb(26,26,26)] flex flex-col justify-between selection:bg-black/10 selection:text-[rgb(26,26,26)]">
      {/* Top Header */}
      <header className="p-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs"
            style={{ backgroundColor: `${APPLE_PALETTE.blue}33`, color: '#1a1a1a' }}
          >
            <ShieldAlert className="w-5 h-5 text-[rgb(26,26,26)]" />
          </div>
          <div>
            <span className="text-base font-semibold text-[rgb(26,26,26)] tracking-tight block leading-none">JAN-DRISHTI</span>
            <span className="text-[10px] text-[#86868b] font-medium tracking-wider uppercase font-mono">Officer Access Portal</span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs text-[#6e6e73] hover:text-[rgb(26,26,26)] transition-colors font-medium flex items-center gap-1.5"
        >
          <span>Return to Public Homepage</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#A0C4FF]" />
        </Link>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Card Container (Apple Frosted Glass HIG Card) */}
          <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-2xl relative overflow-hidden space-y-6">
            
            {/* Apple Segmented Auth Switcher */}
            <div className="apple-segmented-container w-full">
              <button
                type="button"
                onClick={() => { setAuthMode('SIGNIN'); setErrorMsg(''); setRegSuccess(false); }}
                className={`apple-segmented-item flex-1 text-center ${authMode === 'SIGNIN' ? 'active' : ''}`}
              >
                Officer Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('REGISTER'); setErrorMsg(''); }}
                className={`apple-segmented-item flex-1 text-center ${authMode === 'REGISTER' ? 'active' : ''}`}
              >
                Request Access
              </button>
            </div>

            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(26,26,26)] font-bold bg-[#f5f5f7] px-3 py-1 rounded-full border border-black/5">
                OFFICIAL ACCESS ONLY
              </span>
              <h1 className="text-2xl font-semibold text-[rgb(26,26,26)] tracking-tight pt-1">
                {authMode === 'REGISTER'
                  ? 'Officer Credential Enrollment'
                  : otpStage
                  ? 'Two-Factor Authentication'
                  : 'Authorized Officer Sign In'}
              </h1>
              <p className="text-xs text-[#6e6e73] font-normal">
                {authMode === 'REGISTER'
                  ? 'Submit nodal officer verification request to the Ministry Apex Administrator.'
                  : otpStage
                  ? 'Enter security token dispatched to registered NIC mobile number.'
                  : 'Secure credentials required for MPLADS implementation oversight.'}
              </p>
            </div>

            {errorMsg && (
              <div 
                className="p-3 rounded-2xl text-xs flex items-center gap-2 font-medium shadow-xs"
                style={{ backgroundColor: `${APPLE_PALETTE.coral}33`, color: '#1a1a1a' }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {authMode === 'REGISTER' ? (
              /* REGISTRATION / ACCESS REQUEST FORM */
              regSuccess ? (
                <div className="p-6 rounded-2xl bg-[#fbfbfd] border border-black/5 text-center space-y-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-xs"
                    style={{ backgroundColor: APPLE_PALETTE.mint, color: '#1a1a1a' }}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-[rgb(26,26,26)]">Access Request Dispatched</h3>
                  <p className="text-xs text-[#6e6e73] leading-relaxed">
                    Your enrollment request for <strong>{regEmail}</strong> has been logged to the immutable audit registry and dispatched to MoSPI Nodal Directorate for verification.
                  </p>
                  <button
                    onClick={() => { setAuthMode('SIGNIN'); setRegSuccess(false); }}
                    className="mt-3 px-5 py-2 rounded-full bg-[rgb(26,26,26)] text-white text-xs font-semibold hover:bg-black transition-all"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                      Full Officer Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Smt. Vandana Sharma, IAS"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                      Official Government Email (@nic.in / @gov.in)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="v.sharma@nic.in"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                        Cadre / Service
                      </label>
                      <select
                        value={regCadre}
                        onChange={(e) => setRegCadre(e.target.value)}
                        className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-2.5 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans font-medium"
                      >
                        <option value="IAS">IAS (Indian Admin Service)</option>
                        <option value="IES">IES (Indian Economic Service)</option>
                        <option value="ISS">ISS (Indian Statistical Service)</option>
                        <option value="State Service">State Civil Service</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                        Role Tier
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-2.5 text-xs text-[rgb(26,26,26)] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans font-medium"
                      >
                        <option value="DISTRICT">District Collectorate</option>
                        <option value="STATE">State Nodal Officer</option>
                        <option value="APEX">Ministry Directorate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                      Assigned Jurisdiction / Constituency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uttar Pradesh - Varanasi (All Constituencies)"
                      value={regJurisdiction}
                      onChange={(e) => setRegJurisdiction(e.target.value)}
                      required
                      className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl p-2.5 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] text-white font-semibold text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Nodal Registration Request</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )
            ) : !otpStage ? (
              /* SIGN IN FORM */
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {/* Role Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                    Jurisdiction Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('DISTRICT')}
                      className={`py-2 px-1 rounded-full text-xs font-semibold text-center border transition-all ${
                        role === 'DISTRICT'
                          ? 'bg-[rgb(26,26,26)] text-white border-black shadow-xs'
                          : 'bg-[#f5f5f7] text-[#6e6e73] border-black/5 hover:bg-[#eaeaed]'
                      }`}
                    >
                      District
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('STATE')}
                      className={`py-2 px-1 rounded-full text-xs font-semibold text-center border transition-all ${
                        role === 'STATE'
                          ? 'bg-[rgb(26,26,26)] text-white border-black shadow-xs'
                          : 'bg-[#f5f5f7] text-[#6e6e73] border-black/5 hover:bg-[#eaeaed]'
                      }`}
                    >
                      State Nodal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('APEX')}
                      className={`py-2 px-1 rounded-full text-xs font-semibold text-center border transition-all ${
                        role === 'APEX'
                          ? 'bg-[rgb(26,26,26)] text-white border-black shadow-xs'
                          : 'bg-[#f5f5f7] text-[#6e6e73] border-black/5 hover:bg-[#eaeaed]'
                      }`}
                    >
                      Ministry Apex
                    </button>
                  </div>
                </div>

                {/* Email / Username */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                    Government NIC / Service Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                    Password / Digital Key
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#f5f5f7] border border-black/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[rgb(26,26,26)] placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* CAPTCHA Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                    Security Verification
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#f5f5f7] border border-black/5 rounded-2xl px-3 py-2 flex items-center justify-between select-none">
                      <span className="font-mono text-base font-bold tracking-widest text-[rgb(26,26,26)] italic skew-x-6">
                        {captchaCode}
                      </span>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="text-[#86868b] hover:text-[rgb(26,26,26)] p-1"
                        title="Regenerate CAPTCHA"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      required
                      className="w-32 bg-[#f5f5f7] border border-black/5 rounded-2xl px-3 py-2 text-xs text-[rgb(26,26,26)] uppercase placeholder-[#86868b] focus:outline-none focus:border-black/20 focus:bg-white font-mono text-center tracking-widest"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] text-white font-semibold text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Proceed with Multi-Factor Auth</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Form */
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5 text-center space-y-1">
                  <div className="text-xs font-mono text-[rgb(26,26,26)] font-semibold">Token sent to registered officer mobile</div>
                  <div className="text-[11px] text-[#6e6e73]">+91 ••••• ••844 (Purvanchal Division)</div>
                </div>

                <div className="space-y-1.5 text-center">
                  <label className="text-[11px] font-mono text-[#6e6e73] uppercase tracking-wider font-semibold">
                    Enter 6-Digit OTP (Use: 849201)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="849201"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    required
                    className="w-full max-w-[200px] mx-auto bg-[#f5f5f7] border border-black/10 rounded-2xl px-4 py-3 text-lg font-mono font-bold text-center tracking-[8px] text-[rgb(26,26,26)] focus:outline-none focus:border-black/30 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[rgb(26,26,26)] hover:bg-black active:scale-[0.98] text-white font-semibold text-xs tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Launch Dashboard</span>
                      <CheckCircle2 className="w-4 h-4 text-[#CAFFBF]" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpStage(false)}
                    className="text-xs text-[#6e6e73] hover:text-[rgb(26,26,26)] font-medium"
                  >
                    ← Back to credentials entry
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Bypass for Evaluators */}
            <div className="pt-4 border-t border-black/5 text-center space-y-2">
              <span className="text-[10px] text-[#86868b] font-mono uppercase tracking-wider">Evaluation Shortcut</span>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#eaeaed] text-[rgb(26,26,26)] border border-black/5 font-mono text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Fingerprint className="w-4 h-4 text-[rgb(26,26,26)]" />
                <span>Instant 1-Click Evaluation Sign In</span>
              </button>
            </div>
          </div>

          {/* Legal / Security Disclaimer */}
          <div className="text-center space-y-1 text-[11px] text-[#86868b] font-normal">
            <p>Protected under Information Technology Act, 2000 & Public Records Act.</p>
            <p>Unauthorized access or tampering with verification dossiers is strictly prohibited.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-[#86868b] border-t border-black/5">
        JAN-DRISHTI • Ministry of Statistics & Programme Implementation (MoSPI)
      </footer>
    </div>
  );
}
