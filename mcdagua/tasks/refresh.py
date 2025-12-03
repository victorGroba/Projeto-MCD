from mcdagua.core.loader import refresh_dataframe
from mcdagua.extensions import scheduler

def scheduled_refresh():
    # --- CORREÇÃO: Fornece o contexto do aplicativo para a thread ---
    if scheduler.app:
        with scheduler.app.app_context():
            try:
                refresh_dataframe()
                print("✅ [SCHEDULER] Planilha recarregada automaticamente.")
            except Exception as e:
                print(f"❌ [SCHEDULER] Erro ao recarregar: {e}")
    else:
        print("⚠️ [SCHEDULER] App não encontrado no contexto.")