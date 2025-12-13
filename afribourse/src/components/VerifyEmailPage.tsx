import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  if (!email) {
    // Si pas d'email dans le state, rediriger vers l'inscription
    navigate('/signup');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-4 animate-pulse">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vérifiez votre email
          </h2>
          <p className="text-gray-600">
            Nous avons envoyé un email de confirmation à :
          </p>
          <p className="text-lg font-semibold text-blue-600 mt-2 break-all">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
            Vérifiez votre boîte de réception
          </h3>
          <p className="text-sm text-gray-700 mb-4 ml-8">
            Ouvrez l'email que nous venons de vous envoyer.
          </p>

          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
            Cliquez sur le lien
          </h3>
          <p className="text-sm text-gray-700 mb-4 ml-8">
            Cliquez sur le bouton "Confirmer mon email" dans l'email.
          </p>

          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
            Connectez-vous
          </h3>
          <p className="text-sm text-gray-700 ml-8">
            Une fois confirmé, vous pourrez vous connecter à votre compte.
          </p>
        </div>

        {/* Expiration Warning */}
        <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">
              Le lien expire dans 24 heures
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Assurez-vous de confirmer votre email rapidement.
            </p>
          </div>
        </div>

        {/* Spam Folder Warning */}
        <div className="flex items-start space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Vous ne voyez pas l'email ?
            </p>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>• Vérifiez votre dossier <strong>spam</strong> ou <strong>courrier indésirable</strong></li>
              <li>• Vérifiez que vous avez entré la bonne adresse email</li>
              <li>• Attendez quelques minutes (le délai peut être de 1-5 min)</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/renvoyer-confirmation', { state: { email } })}
            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
          >
            Renvoyer l'email de confirmation
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Retour à la connexion
          </button>
        </div>

        {/* Email Preview */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">
            Aperçu de l'email que vous allez recevoir :
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
            <div className="flex items-center mb-2">
              <Mail className="h-3 w-3 mr-1" />
              <span className="font-semibold">De: AfriBourse</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Objet:</span> Confirmez votre inscription
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <p className="mb-2">Bonjour {email.split('@')[0]},</p>
              <p className="mb-2">Merci de vous être inscrit sur AfriBourse...</p>
              <div className="bg-blue-600 text-white text-center py-2 rounded mt-2">
                CONFIRMER MON EMAIL
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide ?{' '}
            <a
              href="mailto:support@africbourse.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
