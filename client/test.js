       <div className="p-8">
  <div className="border-b border-gray-200 pb-6 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
      <UserCircleIcon className="h-8 w-8 text-indigo-600 mr-3" />
      Customer Verification
    </h2>
    <p className="text-gray-600 mt-2">
      Verify customer identity and contact information
    </p>
  </div>

  {/* Customer Profile Header */}
  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 mb-8 border border-indigo-100">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
      {/* Profile Photo */}
      <div className="flex flex-col items-center">
        <div
          className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group transition-all duration-200 hover:shadow-2xl hover:scale-105 relative"
          onClick={() =>
            customer.passport_url &&
            setSelectedImage({
              url: customer.passport_url,
              title: "Customer Profile Photo",
            })
          }
        >
          {customer.passport_url ? (
            <img
              src={customer.passport_url}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <UserCircleIcon className="h-20 w-20 text-gray-400" />
            </div>
          )}
          {customer.passport_url && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white bg-opacity-95 rounded-full p-2 shadow-lg border border-indigo-100">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mt-4 text-center">
          {customer.prefix} {customer.Firstname} {customer.Middlename} {customer.Surname}
        </h3>
        <p className="text-indigo-600 font-semibold">Primary Applicant</p>
      </div>

      {/* Personal Information */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center mb-4">
            <IdentificationIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">ID Number</p>
              <p className="text-xl font-bold text-gray-900">
                {customer.id_number || "Not provided"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Phone:</span>
              <span className="text-sm font-semibold text-gray-900">
                {customer.mobile}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <span className="text-sm font-semibold text-gray-900">
                {customer.email || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Date of Birth:
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {customer.date_of_birth || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Occupation:
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {customer.occupation || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Location:
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {customer.location || "Not provided"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Documents Grid */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <DocumentCard
      title="ID Front"
      imageUrl={customer.id_front_url}
      placeholder="No ID front available"
      icon={IdentificationIcon}
    />
    <DocumentCard
      title="ID Back"
      imageUrl={customer.id_back_url}
      placeholder="No ID back available"
      icon={IdentificationIcon}
    />
    <DocumentCard
      title="Residence"
      imageUrl={customer.house_image_url}
      placeholder="No residence image available"
      icon={HomeIcon}
    />
  </div>

  {/* Verification Controls */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-6">
      Verification Status
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <IdentificationIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="font-medium text-gray-900">ID Verification</span>
          </div>
          <ToggleSwitch
            checked={verificationData.customer.idVerified}
            onChange={(e) =>
              handleVerificationChange(
                "idVerified",
                e.target.checked,
                "customer"
              )
            }
            label="Verify ID"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">📱</span>
            <span className="font-medium text-gray-900">Phone Verification</span>
          </div>
          <ToggleSwitch
            checked={verificationData.customer.phoneVerified}
            onChange={(e) =>
              handleVerificationChange(
                "phoneVerified",
                e.target.checked,
                "customer"
              )
            }
            label="Verify Phone"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        Manager Comments (for Relationship Officer)
      </label>
      <textarea
        value={verificationData.customer.comment}
        onChange={(e) =>
          handleVerificationChange("comment", e.target.value, "customer")
        }
        placeholder="Add instructions for the relationship officer (e.g., 'Please verify phone number', 'Update customer address', etc.)"
        className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        rows={4}
      />
    </div>
  </div>
</div>