import React, { useCallback, useEffect, useState } from 'react';
import { People24Regular, Search24Regular } from '@fluentui/react-icons';
import { useUserProfiles } from '../../hooks/useUserProfiles';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  searchUserProfiles,
  verifiedReasonLabel,
  type ProfilePublic,
  type VerifiedReason,
} from '../../utils/userProfiles';
import {
  loadStaffKey,
  staffUnlock,
  staffVerifyNickname,
  staffUnverifyNickname,
} from '../../utils/staffVerify';
import { toggleFollowCreator } from '../../utils/socialCloud';
import { NicknameWithBadge } from './VerifiedBadge';
import StaffVerifyPanel from './StaffVerifyPanel';

interface UsersDirectoryViewProps {
  nickname: string;
  supabaseUserId: string | null;
  supabaseAuthReady: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'premium') => void;
}

const UsersDirectoryView: React.FC<UsersDirectoryViewProps> = ({
  nickname,
  supabaseUserId,
  supabaseAuthReady,
  showToast,
}) => {
  const { myProfile, requestVerify, isVerified } = useUserProfiles(nickname, supabaseUserId);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfilePublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffReady, setStaffReady] = useState(false);
  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [busyNick, setBusyNick] = useState<string | null>(null);
  const [requestingVerify, setRequestingVerify] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const rows = await searchUserProfiles(q);
      setResults(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseAuthReady) return;
    const t = window.setTimeout(() => {
      void runSearch(query);
    }, query ? 280 : 0);
    return () => clearTimeout(t);
  }, [query, runSearch, supabaseAuthReady]);

  useEffect(() => {
    const key = loadStaffKey();
    if (!key) return;
    void staffUnlock(key)
      .then(setStaffReady)
      .catch(() => setStaffReady(false));
  }, [showStaffPanel]);

  const staffKey = loadStaffKey();

  return (
    <div className="spotify-list-view users-directory">
      <div className="spotify-list-header">
        <div className="users-directory-header">
          <div>
            <h2>Usuarios</h2>
            <p>Buscá creators por nickname · mirá quién está verificado</p>
          </div>
          <button type="button" className="users-staff-link" onClick={() => setShowStaffPanel(true)}>
            Staff
          </button>
        </div>

        {nickname && supabaseUserId && (
          <div className="users-me-card">
            <div>
              <NicknameWithBadge
                name={nickname}
                verified={isVerified || myProfile?.verified}
                reason={myProfile?.verifiedReason}
                size="md"
              />
              <div className="users-me-sub">
                {isVerified || myProfile?.verified
                  ? verifiedReasonLabel(myProfile?.verifiedReason)
                  : 'Tu perfil en NEX Music'}
              </div>
            </div>
            {!(isVerified || myProfile?.verified) && (
              <button
                type="button"
                className="users-verify-req"
                disabled={requestingVerify}
                onClick={() => {
                  void (async () => {
                    setRequestingVerify(true);
                    try {
                      await requestVerify('Quiero el check de creador en NEX Music');
                      showToast('Solicitud enviada', 'premium');
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : 'Error', 'info');
                    } finally {
                      setRequestingVerify(false);
                    }
                  })();
                }}
              >
                {requestingVerify ? '…' : 'Solicitar ✓'}
              </button>
            )}
          </div>
        )}

        <div className="users-search-box">
          <Search24Regular />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuarios…"
            autoFocus
          />
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="spotify-empty">
          <p>Configurá Supabase para ver usuarios</p>
        </div>
      )}

      {isSupabaseConfigured && !supabaseAuthReady && (
        <div className="spotify-loading">
          <div className="spotify-spinner" />
          <p>Conectando…</p>
        </div>
      )}

      {loading && <div className="users-loading">Buscando…</div>}

      {!loading && results.length === 0 && supabaseAuthReady && (
        <div className="spotify-empty">
          <People24Regular />
          <p>
            {query.trim()
              ? 'No hay usuarios con ese nombre'
              : 'Todavía no hay perfiles · abrí la app con un nickname para aparecer'}
          </p>
          <p className="users-empty-hint">
            Si no ves a nadie, ejecutá <code>schema-profiles-v4.sql</code> en Supabase
          </p>
        </div>
      )}

      <div className="users-list">
        {results.map((u) => {
          const isMe = nickname && u.nickname.toLowerCase() === nickname.toLowerCase();
          return (
            <div key={u.nickname} className="users-row">
              <div className="users-row-main">
                <div className="users-avatar" aria-hidden>
                  {(u.displayName || u.nickname).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="users-row-name">
                    <NicknameWithBadge
                      name={u.displayName || u.nickname}
                      verified={u.verified}
                      reason={u.verifiedReason}
                    />
                    {isMe ? <span className="users-you">vos</span> : null}
                  </div>
                  <div className="users-row-meta">
                    @{u.nickname}
                    {u.verified ? ` · ${verifiedReasonLabel(u.verifiedReason)}` : ''}
                  </div>
                </div>
              </div>
              <div className="users-row-actions">
                {!isMe && nickname && (
                  <button
                    type="button"
                    disabled={busyNick === u.nickname}
                    onClick={() => {
                      void (async () => {
                        setBusyNick(u.nickname);
                        try {
                          const on = await toggleFollowCreator(nickname, u.nickname);
                          showToast(on ? `Seguís a ${u.nickname}` : `Dejaste de seguir`, 'success');
                        } catch {
                          showToast('No se pudo seguir (schema social)', 'info');
                        } finally {
                          setBusyNick(null);
                        }
                      })();
                    }}
                  >
                    Seguir
                  </button>
                )}
                {staffReady && staffKey && (
                  u.verified ? (
                    <button
                      type="button"
                      className="danger"
                      disabled={busyNick === u.nickname}
                      onClick={() => {
                        void (async () => {
                          setBusyNick(u.nickname);
                          try {
                            await staffUnverifyNickname(u.nickname, staffKey);
                            showToast(`✓ quitado a ${u.nickname}`, 'info');
                            await runSearch(query);
                          } catch (err) {
                            showToast(err instanceof Error ? err.message : 'Error', 'error');
                          } finally {
                            setBusyNick(null);
                          }
                        })();
                      }}
                    >
                      Quitar ✓
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="verify"
                      disabled={busyNick === u.nickname}
                      onClick={() => {
                        void (async () => {
                          setBusyNick(u.nickname);
                          try {
                            await staffVerifyNickname(u.nickname, 'creator' as VerifiedReason, staffKey);
                            showToast(`${u.nickname} verificado ✓`, 'premium');
                            await runSearch(query);
                          } catch (err) {
                            showToast(err instanceof Error ? err.message : 'Error', 'error');
                          } finally {
                            setBusyNick(null);
                          }
                        })();
                      }}
                    >
                      Dar ✓
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <StaffVerifyPanel
        open={showStaffPanel}
        onClose={() => setShowStaffPanel(false)}
        showToast={showToast}
      />

      <style>{`
        .users-directory-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .users-directory-header p {
          margin: 6px 0 0;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
        }
        .users-staff-link {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.45);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 11px;
          cursor: pointer;
        }
        .users-me-card {
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          background: rgba(29,155,240,0.08);
          border: 1px solid rgba(29,155,240,0.22);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .users-me-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          margin-top: 4px;
        }
        .users-verify-req {
          background: #1d9bf0;
          border: none;
          color: #fff;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .users-search-box {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 14px;
        }
        .users-search-box input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 15px;
        }
        .users-loading {
          padding: 16px;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
        }
        .users-empty-hint {
          font-size: 12px !important;
          color: rgba(255,255,255,0.35) !important;
        }
        .users-empty-hint code { color: #8ecdf8; }
        .users-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 0 24px;
        }
        .users-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .users-row-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .users-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d9bf0, #12d6c5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #041018;
          flex-shrink: 0;
        }
        .users-row-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
        }
        .users-you {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #1d9bf0;
          background: rgba(29,155,240,0.15);
          padding: 2px 6px;
          border-radius: 999px;
        }
        .users-row-meta {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          margin-top: 2px;
        }
        .users-row-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .users-row-actions button {
          border: none;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .users-row-actions button.verify { background: #1d9bf0; }
        .users-row-actions button.danger { background: rgba(255,80,80,0.85); }
      `}</style>
    </div>
  );
};

export default UsersDirectoryView;
